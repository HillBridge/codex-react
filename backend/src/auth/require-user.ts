import type { Context } from "koa";
import { ApiHttpError } from "../lib/errors";
import { currentSession } from "./session";

export function requireUser(ctx: Context) {
  const user = currentSession(ctx);
  if (!user) throw new ApiHttpError(401, "UNAUTHENTICATED", "请先登录。");
  return user;
}
