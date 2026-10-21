import Router from "@koa/router";
import { loginSchema } from "@merchant/contracts";
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
  const parsed = loginSchema.safeParse(ctx.request.body ?? {});
  if (!parsed.success)
    throw new ApiHttpError(400, "INVALID_CREDENTIALS", parsed.error.issues[0].message);

  const user = findUser(parsed.data.username, parsed.data.password);
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
