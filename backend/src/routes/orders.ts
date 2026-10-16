import Router from "@koa/router";
import { requireUser } from "../auth/require-user";
import { deleteOrder, findOrder, listOrders, updateOrder } from "../data/store";
import { ApiHttpError } from "../lib/errors";
import { boundedInteger } from "../lib/pagination";

export const orderRouter = new Router({ prefix: "/api/merchants/:merchantId" });

orderRouter.get("/orders", (ctx) => {
  const user = requireUser(ctx);
  if (ctx.params.merchantId !== user.merchant.id)
    throw new ApiHttpError(403, "MERCHANT_FORBIDDEN", "无权访问该商户。");
  const rawStatus = ctx.query.status;
  const status =
    typeof rawStatus === "string" &&
    ["pending", "confirmed", "cancelled"].includes(rawStatus)
      ? rawStatus
      : "all";
  const query = String(ctx.query.q ?? "")
    .trim()
    .toLowerCase();
  const page = boundedInteger(ctx.query.page, 1);
  const pageSize = boundedInteger(ctx.query.pageSize, 20, 100);
  const filtered = listOrders(user.merchant.id).filter(
    (order) =>
      (status === "all" || status === order.status) &&
      (!query || order.number.toLowerCase().includes(query) || order.id.includes(query)),
  );
  ctx.body = {
    items: filtered.slice((page - 1) * pageSize, page * pageSize),
    total: filtered.length,
    page,
    pageSize,
  };
});

orderRouter.get("/orders/:orderId", (ctx) => {
  const user = requireUser(ctx);
  if (ctx.params.merchantId !== user.merchant.id)
    throw new ApiHttpError(403, "MERCHANT_FORBIDDEN", "无权访问该商户。");
  const order = findOrder(ctx.params.orderId, user.merchant.id);
  if (!order) throw new ApiHttpError(404, "ORDER_NOT_FOUND", "订单不存在。");
  ctx.body = order;
});

orderRouter.patch("/orders/:orderId/status", (ctx) => {
  const user = requireUser(ctx);
  if (
    ctx.params.merchantId !== user.merchant.id ||
    !user.merchant.permissions.includes("order:update")
  )
    throw new ApiHttpError(403, "ORDER_UPDATE_FORBIDDEN", "无权修改订单。");
  const order = findOrder(ctx.params.orderId, user.merchant.id);
  if (!order) throw new ApiHttpError(404, "ORDER_NOT_FOUND", "订单不存在。");
  const body = ctx.request.body as {
    status?: "confirmed" | "cancelled";
    expectedVersion?: number;
  };
  if (body.expectedVersion !== order.version)
    throw new ApiHttpError(409, "ORDER_CONFLICT", "订单状态已变化，请刷新后重试。");
  if (
    order.status !== "pending" ||
    !["confirmed", "cancelled"].includes(body.status ?? "")
  )
    throw new ApiHttpError(409, "INVALID_ORDER_TRANSITION", "当前订单状态不支持此操作。");
  ctx.body = updateOrder(order, body.status as "confirmed" | "cancelled");
});

orderRouter.delete("/orders/:orderId", (ctx) => {
  const user = requireUser(ctx);
  if (
    ctx.params.merchantId !== user.merchant.id ||
    !user.merchant.permissions.includes("order:delete")
  )
    throw new ApiHttpError(403, "ORDER_DELETE_FORBIDDEN", "无权删除订单。");
  const order = findOrder(ctx.params.orderId, user.merchant.id);
  if (!order) throw new ApiHttpError(404, "ORDER_NOT_FOUND", "订单不存在。");
  deleteOrder(order);
  ctx.status = 204;
});
