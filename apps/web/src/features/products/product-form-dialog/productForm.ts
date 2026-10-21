import { z } from "zod";
import {
  nameSchema,
  priceCentsSchema,
  productStatusSchema,
  skuSchema,
  stockSchema,
} from "@merchant/contracts";
import type { Product } from "../types";

// 表单里价格以元输入、库存是字符串；规则复用契约里的字段，转换成接口需要的分和数字。
export const productFormSchema = z.object({
  sku: skuSchema,
  name: nameSchema,
  price: z
    .string()
    .trim()
    .min(1, "请输入价格")
    .regex(
      /^(0|[1-9]\d*)(\.\d{1,2})?$/,
      "价格格式不正确：最多两位小数，整数部分不能以 0 开头",
    )
    .transform((yuan) => Math.round(Number(yuan) * 100))
    .pipe(priceCentsSchema),
  stock: z
    .string()
    .trim()
    .min(1, "请输入库存")
    .regex(/^(0|[1-9]\d*)$/, "库存必须是非负整数，且不能以 0 开头")
    .transform(Number)
    .pipe(stockSchema),
  status: productStatusSchema,
});

// 表单字段的输入形态（字符串），以及校验通过后交给接口的形态（分、数字）。
export type ProductFormValues = z.input<typeof productFormSchema>;
export type ProductFormOutput = z.output<typeof productFormSchema>;

export const emptyProductFormValues: ProductFormValues = {
  sku: "",
  name: "",
  price: "",
  stock: "",
  status: "on",
};

// 输入时过滤掉不可能合法的字符，让非法内容根本输不进去。
export const sanitizeSku = (value: string) =>
  value.replace(/[^A-Za-z0-9_-]/g, "").slice(0, 32);
export const sanitizeName = (value: string) => value.slice(0, 50);
export const sanitizeStock = (value: string) => value.replace(/\D/g, "").slice(0, 6);
export function sanitizePrice(value: string) {
  const [integer, ...rest] = value.replace(/[^\d.]/g, "").split(".");
  return rest.length
    ? `${integer.slice(0, 6)}.${rest.join("").slice(0, 2)}`
    : integer.slice(0, 6);
}

// 编辑时把已有商品转回表单值：价格从分换回元。
export function productToFormValues(product: Product): ProductFormValues {
  return {
    sku: product.sku,
    name: product.name,
    price: (product.price / 100).toFixed(2),
    stock: String(product.stock),
    status: product.status,
  };
}
