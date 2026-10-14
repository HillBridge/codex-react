import { randomUUID } from "node:crypto";
import type { Context, Next } from "koa";

export async function requestId(ctx: Context, next: Next) {
  const value = ctx.get("x-request-id") || randomUUID();
  ctx.state.requestId = value;
  ctx.set("x-request-id", value);
  await next();
}
