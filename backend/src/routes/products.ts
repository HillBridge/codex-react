import Router from "@koa/router";
import { requireMerchantUser } from "../auth/require-user";
import { createProduct, findProductBySku, listProducts } from "../data/store";
import { ApiHttpError } from "../lib/errors";
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

const SKU_PATTERN = /^[A-Za-z0-9_-]{1,32}$/;

function validationError(message: string) {
  return new ApiHttpError(400, "VALIDATION_ERROR", message);
}

function parseNewProduct(body: unknown) {
  const input = (typeof body === "object" && body !== null ? body : {}) as Record<
    string,
    unknown
  >;
  const sku = typeof input.sku === "string" ? input.sku.trim() : "";
  const name = typeof input.name === "string" ? input.name.trim() : "";
  const { price, stock, status } = input;

  if (!SKU_PATTERN.test(sku))
    throw validationError("SKU 只能包含字母、数字、下划线和短横线，长度 1-32。");
  if (!name || name.length > 50)
    throw validationError("商品名称不能为空，最多 50 个字。");
  if (!Number.isInteger(price) || (price as number) < 0 || (price as number) > 99_999_999)
    throw validationError("价格必须是不小于 0 的整数（单位：分）。");
  if (!Number.isInteger(stock) || (stock as number) < 0 || (stock as number) > 999_999)
    throw validationError("库存必须是不小于 0 的整数。");
  if (status !== "on" && status !== "off")
    throw validationError("商品状态只能是在售或已下架。");

  return {
    sku,
    name,
    price: price as number,
    stock: stock as number,
    status: status as "on" | "off",
  };
}

productRouter.post("/products", (ctx) => {
  const user = requireMerchantUser(ctx);
  if (!user.merchant.permissions.includes("product:create"))
    throw new ApiHttpError(403, "PRODUCT_CREATE_FORBIDDEN", "无权新建商品。");
  const input = parseNewProduct(ctx.request.body);
  if (findProductBySku(user.merchant.id, input.sku))
    throw new ApiHttpError(409, "SKU_DUPLICATED", "该 SKU 已存在。");
  ctx.status = 201;
  ctx.body = createProduct(user.merchant.id, input);
});
