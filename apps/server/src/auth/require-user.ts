import type { Context } from "koa";
import { ApiHttpError } from "../lib/errors";
import { currentSession } from "./session";

export function requireUser(ctx: Context) {
  const user = currentSession(ctx);
  if (!user) throw new ApiHttpError(401, "UNAUTHENTICATED", "请先登录。");
  return user;
}

// 读取接口通用：必须登录，且只能访问自己所属商户的数据。
export function requireMerchantUser(ctx: Context) {
  const user = requireUser(ctx);
  if (ctx.params.merchantId !== user.merchant.id)
    throw new ApiHttpError(403, "MERCHANT_FORBIDDEN", "无权访问该商户。");
  return user;
}
