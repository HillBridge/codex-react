import Router from "@koa/router";
import { requireMerchantUser } from "../auth/require-user";
import { findSettlement, listSettlementOrders, listSettlements } from "../data/store";
import { ApiHttpError } from "../lib/errors";
import { boundedInteger } from "../lib/pagination";

export const settlementRouter = new Router({ prefix: "/api/merchants/:merchantId" });

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
      const orders = listSettlementOrders(settlement);
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
  ctx.body = { items: listSettlementOrders(settlement) };
});
