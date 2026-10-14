import { resolve } from "node:path";
import bodyParser from "koa-bodyparser";
import Koa, { type Context, type Next } from "koa";
import serve from "koa-static";
import { ApiHttpError, sendApiError } from "./lib/errors";
import { requestId } from "./lib/request-id";

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
    if (!ctx.path.startsWith("/api/")) {
      await next();
      return;
    }

    sendApiError(ctx, 404, "NOT_FOUND", "接口不存在。");
  });

  if (options.serveStatic) {
    app.use(serve(resolve(process.cwd(), "dist")));
  }

  return app;
}
