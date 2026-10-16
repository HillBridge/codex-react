import Router from "@koa/router";
import { requireMerchantUser } from "../auth/require-user";
import { findOrder, findSettlement, listSettlements } from "../data/store";
import type { DemoSettlement } from "../data/demo-data";
import { ApiHttpError } from "../lib/errors";
import { boundedInteger } from "../lib/pagination";

export const settlementRouter = new Router({ prefix: "/api/merchants/:merchantId" });

// 结算包含的订单可能已被删除，金额与订单数按仍存在的订单实时汇总。
function includedOrders(settlement: DemoSettlement) {
  return settlement.orderIds.flatMap((orderId) => {
    const order = findOrder(orderId, settlement.merchantId);
    return order ? [order] : [];
  });
}

settlementRouter.get("/settlements", (ctx) => {
  const user = requireMerchantUser(ctx);
  const rawStatus = ctx.query.status;
  const status = rawStatus === "pending" || rawStatus === "paid" ? rawStatus : "all";
  const page = boundedInteger(ctx.query.page, 1);
  const pageSize = boundedInteger(ctx.query.pageSize, 10, 100);
  const filtered = listSettlements(user.merchant.id).filter(
    (settlement) => status === "all" || status === settlement.status,
  );
  ctx.body = {
    items: filtered.slice((page - 1) * pageSize, page * pageSize).map((settlement) => {
      const orders = includedOrders(settlement);
      return {
        id: settlement.id,
        number: settlement.number,
        periodStart: settlement.periodStart,
        periodEnd: settlement.periodEnd,
        status: settlement.status,
        orderCount: orders.length,
        amount: orders.reduce((sum, order) => sum + order.amount, 0),
      };
    }),
    total: filtered.length,
    page,
    pageSize,
  };
});

settlementRouter.get("/settlements/:settlementId/orders", (ctx) => {
  const user = requireMerchantUser(ctx);
  const settlement = findSettlement(ctx.params.settlementId, user.merchant.id);
  if (!settlement) throw new ApiHttpError(404, "SETTLEMENT_NOT_FOUND", "结算单不存在。");
  ctx.body = { items: includedOrders(settlement) };
});
