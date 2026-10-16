import Router from "@koa/router";
import { requireMerchantUser } from "../auth/require-user";
import { listProducts } from "../data/store";
import { boundedInteger } from "../lib/pagination";

export const productRouter = new Router({ prefix: "/api/merchants/:merchantId" });

productRouter.get("/products", (ctx) => {
  const user = requireMerchantUser(ctx);
  const rawStatus = ctx.query.status;
  const status = rawStatus === "on" || rawStatus === "off" ? rawStatus : "all";
  const query = String(ctx.query.q ?? "")
    .trim()
    .toLowerCase();
  const page = boundedInteger(ctx.query.page, 1);
  const pageSize = boundedInteger(ctx.query.pageSize, 10, 100);
  const filtered = listProducts(user.merchant.id).filter(
    (product) =>
      (status === "all" || status === product.status) &&
      (!query ||
        product.name.toLowerCase().includes(query) ||
        product.sku.toLowerCase().includes(query)),
  );
  ctx.body = {
    items: filtered.slice((page - 1) * pageSize, page * pageSize),
    total: filtered.length,
    page,
    pageSize,
  };
});
