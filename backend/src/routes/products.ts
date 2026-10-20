import Router from "@koa/router";
import { requireMerchantUser } from "../auth/require-user";
import {
  createProduct,
  findProduct,
  findProductBySku,
  listProducts,
  updateProduct,
} from "../data/store";
import { productInputSchema } from "../../../contracts/product";
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

function parseProductInput(body: unknown) {
  const result = productInputSchema.safeParse(body);
  if (!result.success)
    throw new ApiHttpError(400, "VALIDATION_ERROR", result.error.issues[0].message);
  return result.data;
}

productRouter.post("/products", (ctx) => {
  const user = requireMerchantUser(ctx);
  if (!user.merchant.permissions.includes("product:create"))
    throw new ApiHttpError(403, "PRODUCT_CREATE_FORBIDDEN", "无权新建商品。");
  const input = parseProductInput(ctx.request.body);
  if (findProductBySku(user.merchant.id, input.sku))
    throw new ApiHttpError(409, "SKU_DUPLICATED", "该 SKU 已存在。");
  ctx.status = 201;
  ctx.body = createProduct(user.merchant.id, input);
});

productRouter.put("/products/:productId", (ctx) => {
  const user = requireMerchantUser(ctx);
  if (!user.merchant.permissions.includes("product:update"))
    throw new ApiHttpError(403, "PRODUCT_UPDATE_FORBIDDEN", "无权编辑商品。");
  const product = findProduct(ctx.params.productId, user.merchant.id);
  if (!product) throw new ApiHttpError(404, "PRODUCT_NOT_FOUND", "商品不存在。");
  const input = parseProductInput(ctx.request.body);
  // 允许保持自己原来的 SKU，只与其他商品比较。
  const sameSku = findProductBySku(user.merchant.id, input.sku);
  if (sameSku && sameSku !== product)
    throw new ApiHttpError(409, "SKU_DUPLICATED", "该 SKU 已存在。");
  ctx.body = updateProduct(product, input);
});
