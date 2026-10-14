import Router from "@koa/router";
import { createSession, clearSession } from "../auth/session";
import { findUser } from "../data/store";
import { ApiHttpError } from "../lib/errors";
import { requireUser } from "../auth/require-user";

function sessionResponse(user: ReturnType<typeof requireUser>) {
  return {
    user: { id: user.id, name: user.name },
    merchant: user.merchant,
  };
}

export const authRouter = new Router({ prefix: "/api" });

authRouter.post("/auth/login", (ctx) => {
  const body = ctx.request.body as { username?: unknown; password?: unknown };
  if (
    typeof body?.username !== "string" ||
    !body.username.trim() ||
    typeof body.password !== "string" ||
    !body.password
  ) {
    throw new ApiHttpError(400, "INVALID_CREDENTIALS", "请输入用户名和密码。");
  }

  const user = findUser(body.username, body.password);
  if (!user) throw new ApiHttpError(401, "INVALID_CREDENTIALS", "用户名或密码错误。");

  createSession(ctx, user);
  ctx.body = sessionResponse(user);
});

authRouter.post("/auth/logout", (ctx) => {
  clearSession(ctx);
  ctx.status = 204;
});

authRouter.get("/session", (ctx) => {
  ctx.body = sessionResponse(requireUser(ctx));
});
