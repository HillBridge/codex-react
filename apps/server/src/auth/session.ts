import { randomUUID } from "node:crypto";
import type { Context } from "koa";
import type { DemoUser } from "../data/demo-data";
import { deleteSession, getSession, saveSession } from "../data/store";

export const sessionCookieName = "merchant_session";
// 登录后固定 2 小时失效（绝对过期，不随操作续期）。
export const sessionTtlMs = 2 * 60 * 60 * 1000;

function sessionIdFrom(ctx: Context) {
  const prefix = `${sessionCookieName}=`;
  return ctx
    .get("cookie")
    .split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(prefix))
    ?.slice(prefix.length);
}

export function sessionCookieOptions() {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    signed: false,
    secure: process.env.NODE_ENV === "production",
    path: "/",
  };
}

export function createSession(ctx: Context, user: DemoUser) {
  const id = randomUUID();
  saveSession(id, user, Date.now() + sessionTtlMs);
  ctx.cookies.set(sessionCookieName, id, {
    ...sessionCookieOptions(),
    maxAge: sessionTtlMs,
  });
}

export function currentSession(ctx: Context) {
  return getSession(sessionIdFrom(ctx));
}

export function clearSession(ctx: Context) {
  const id = sessionIdFrom(ctx);
  deleteSession(id);
  ctx.cookies.set(sessionCookieName, null, sessionCookieOptions());
}
