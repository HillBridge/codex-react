import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { createReadStream } from "node:fs";
import bodyParser from "koa-bodyparser";
import Koa, { type Context, type Next } from "koa";
import serve from "koa-static";
import { ApiHttpError, sendApiError } from "./lib/errors";
import { requestId } from "./lib/request-id";
import { authRouter } from "./routes/auth";
import { orderRouter } from "./routes/orders";
import { overviewRouter } from "./routes/overview";
import { productRouter } from "./routes/products";
import { settlementRouter } from "./routes/settlements";

interface CreateAppOptions {
  serveStatic?: boolean;
}

async function errorHandler(ctx: Context, next: Next) {
  try {
    await next();
  } catch (error) {
    if (error instanceof ApiHttpError) {
      sendApiError(ctx, error.status, error.code, error.message);
      return;
    }

    ctx.app.emit("error", error, ctx);
    sendApiError(ctx, 500, "INTERNAL_ERROR", "服务暂时不可用，请稍后重试。");
  }
}

// 前端构建产物位于 apps/web/dist，按本文件位置定位，与启动时的工作目录无关。
const webDist = fileURLToPath(new URL("../../web/dist", import.meta.url));

export function createApp(options: CreateAppOptions = {}) {
  const app = new Koa();
  // 部署在 HTTPS 反向代理之后时设为 true，Koa 才会信任 X-Forwarded-Proto，secure cookie 才能下发。
  app.proxy = process.env.TRUST_PROXY === "true";

  app.use(errorHandler);
  app.use(requestId);
  app.use(bodyParser());
  app.use(async (ctx, next) => {
    if (ctx.method === "GET" && ctx.path === "/health") {
      ctx.body = { status: "ok" };
      return;
    }
    await next();
  });
  app.use(authRouter.routes());
  app.use(authRouter.allowedMethods());
  app.use(orderRouter.routes());
  app.use(orderRouter.allowedMethods());
  app.use(productRouter.routes());
  app.use(productRouter.allowedMethods());
  app.use(settlementRouter.routes());
  app.use(settlementRouter.allowedMethods());
  app.use(overviewRouter.routes());
  app.use(overviewRouter.allowedMethods());

  app.use(async (ctx, next) => {
    if (!ctx.path.startsWith("/api/")) {
      await next();
      return;
    }

    sendApiError(ctx, 404, "NOT_FOUND", "接口不存在。");
  });

  if (options.serveStatic) {
    app.use(serve(webDist));
    app.use(async (ctx, next) => {
      await next();
      if (ctx.method === "GET" && !ctx.path.startsWith("/api/")) {
        ctx.type = "html";
        ctx.body = createReadStream(resolve(webDist, "index.html"));
      }
    });
  }

  return app;
}
