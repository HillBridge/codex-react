import Router from "@koa/router";
import { requireMerchantUser } from "../auth/require-user";
import {
  listOrders,
  listProducts,
  listSettlementOrders,
  listSettlements,
} from "../data/store";

export const overviewRouter = new Router({ prefix: "/api/merchants/:merchantId" });

const LOW_STOCK_THRESHOLD = 20;

overviewRouter.get("/overview", (ctx) => {
  const user = requireMerchantUser(ctx);
  const merchantId = user.merchant.id;

  const orders = listOrders(merchantId);
  const count = (status: string) =>
    orders.filter((order) => order.status === status).length;

  const pendingSettlements = listSettlements(merchantId).filter(
    (settlement) => settlement.status === "pending",
  );
  const products = listProducts(merchantId);

  ctx.body = {
    orders: {
      total: orders.length,
      pending: count("pending"),
      confirmed: count("confirmed"),
      cancelled: count("cancelled"),
      confirmedAmount: orders
        .filter((order) => order.status === "confirmed")
        .reduce((sum, order) => sum + order.amount, 0),
    },
    settlements: {
      pendingCount: pendingSettlements.length,
      pendingAmount: pendingSettlements
        .flatMap(listSettlementOrders)
        .reduce((sum, order) => sum + order.amount, 0),
    },
    products: {
      onShelf: products.filter((product) => product.status === "on").length,
      offShelf: products.filter((product) => product.status === "off").length,
      lowStock: products.filter(
        (product) => product.status === "on" && product.stock < LOW_STOCK_THRESHOLD,
      ).length,
    },
  };
});
