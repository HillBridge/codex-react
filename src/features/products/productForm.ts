import type { NewProduct, ProductStatus } from "./types";

export interface ProductFormValues {
  sku: string;
  name: string;
  // 表单里价格以元输入，提交时转换为分。
  price: string;
  stock: string;
  status: ProductStatus;
}

export type ProductTextField = "sku" | "name" | "price" | "stock";
export type ProductFormErrors = Partial<Record<keyof ProductFormValues, string>>;

export type ParsedProductForm =
  { ok: true; data: NewProduct } | { ok: false; errors: ProductFormErrors };

const MAX_PRICE_YUAN = 999_999.99;
const MAX_STOCK = 999_999;

// 输入时过滤掉不可能合法的字符，让非法内容根本输不进去。
export function sanitizeProductField(key: ProductTextField, value: string) {
  switch (key) {
    case "sku":
      return value.replace(/[^A-Za-z0-9_-]/g, "").slice(0, 32);
    case "name":
      return value.slice(0, 50);
    case "price": {
      const [integer, ...rest] = value.replace(/[^\d.]/g, "").split(".");
      return rest.length
        ? `${integer.slice(0, 6)}.${rest.join("").slice(0, 2)}`
        : integer.slice(0, 6);
    }
    case "stock":
      return value.replace(/\D/g, "").slice(0, 6);
  }
}

// 规则与后端 parseNewProduct 保持一致，后端是最终校验。
export function validateProductField(
  key: ProductTextField,
  rawValue: string,
): string | undefined {
  const value = rawValue.trim();
  switch (key) {
    case "sku":
      if (!value) return "请输入 SKU";
      if (!/^[A-Za-z0-9_-]{1,32}$/.test(value)) {
        return "SKU 只能包含字母、数字、下划线和短横线，最多 32 位";
      }
      return undefined;
    case "name":
      if (!value) return "请输入商品名称";
      if (value.length > 50) return "商品名称最多 50 个字";
      return undefined;
    case "price":
      if (!value) return "请输入价格";
      if (!/^(0|[1-9]\d*)(\.\d{1,2})?$/.test(value)) {
        return "价格格式不正确：最多两位小数，整数部分不能以 0 开头";
      }
      if (Number(value) > MAX_PRICE_YUAN) return "价格不能超过 999999.99";
      return undefined;
    case "stock":
      if (!value) return "请输入库存";
      if (!/^(0|[1-9]\d*)$/.test(value)) return "库存必须是非负整数，且不能以 0 开头";
      if (Number(value) > MAX_STOCK) return "库存不能超过 999999";
      return undefined;
  }
}

const textFields: ProductTextField[] = ["sku", "name", "price", "stock"];

export function parseProductForm(values: ProductFormValues): ParsedProductForm {
  const errors: ProductFormErrors = {};
  for (const key of textFields) {
    const message = validateProductField(key, values[key]);
    if (message) errors[key] = message;
  }
  if (Object.keys(errors).length > 0) return { ok: false, errors };

  return {
    ok: true,
    data: {
      sku: values.sku.trim(),
      name: values.name.trim(),
      price: Math.round(Number(values.price.trim()) * 100),
      stock: Number(values.stock.trim()),
      status: values.status,
    },
  };
}
