import { resolve } from "node:path";
import { createReadStream } from "node:fs";
import bodyParser from "koa-bodyparser";
import Koa, { type Context, type Next } from "koa";
import serve from "koa-static";
import { ApiHttpError, sendApiError } from "./lib/errors";
import { requestId } from "./lib/request-id";
import { authRouter } from "./routes/auth";
import { orderRouter } from "./routes/orders";

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

export function createApp(options: CreateAppOptions = {}) {
  const app = new Koa();

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

  app.use(async (ctx, next) => {
    if (!ctx.path.startsWith("/api/")) {
      await next();
      return;
    }

    sendApiError(ctx, 404, "NOT_FOUND", "接口不存在。");
  });

  if (options.serveStatic) {
    app.use(serve(resolve(process.cwd(), "dist")));
    app.use(async (ctx, next) => {
      await next();
      if (ctx.method === "GET" && !ctx.path.startsWith("/api/")) {
        ctx.type = "html";
        ctx.body = createReadStream(resolve(process.cwd(), "dist/index.html"));
      }
    });
  }

  return app;
}
