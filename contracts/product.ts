// 商品的接口契约：前后端共用的校验规则，是规则的唯一来源。
// 后端用 productInputSchema 校验请求；前端表单的 schema 由这里的字段组合而来。
import { z } from "zod";

export const PRODUCT_LIMITS = {
  skuMaxLength: 32,
  nameMaxLength: 50,
  maxPriceCents: 99_999_999,
  maxStock: 999_999,
} as const;

export const skuSchema = z
  .string({ error: "SKU 必须是字符串" })
  .trim()
  .min(1, "请输入 SKU")
  .regex(
    new RegExp(`^[A-Za-z0-9_-]{1,${PRODUCT_LIMITS.skuMaxLength}}$`),
    `SKU 只能包含字母、数字、下划线和短横线，最多 ${PRODUCT_LIMITS.skuMaxLength} 位`,
  );

export const nameSchema = z
  .string({ error: "商品名称必须是字符串" })
  .trim()
  .min(1, "请输入商品名称")
  .max(PRODUCT_LIMITS.nameMaxLength, `商品名称最多 ${PRODUCT_LIMITS.nameMaxLength} 个字`);

// 价格以分为单位。
export const priceCentsSchema = z
  .number({ error: "价格必须是数字" })
  .int("价格必须是整数（单位：分）")
  .min(0, "价格不能为负")
  .max(PRODUCT_LIMITS.maxPriceCents, "价格不能超过 999999.99");

export const stockSchema = z
  .number({ error: "库存必须是数字" })
  .int("库存必须是整数")
  .min(0, "库存不能为负")
  .max(PRODUCT_LIMITS.maxStock, `库存不能超过 ${PRODUCT_LIMITS.maxStock}`);

export const productStatusSchema = z.enum(["on", "off"], {
  error: "商品状态只能是在售或已下架",
});

export const productInputSchema = z.object({
  sku: skuSchema,
  name: nameSchema,
  price: priceCentsSchema,
  stock: stockSchema,
  status: productStatusSchema,
});

export type ProductInput = z.infer<typeof productInputSchema>;
