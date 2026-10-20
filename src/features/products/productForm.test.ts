import { describe, expect, it } from "vitest";
import {
  productFormSchema,
  productToFormValues,
  sanitizeName,
  sanitizePrice,
  sanitizeSku,
  sanitizeStock,
  type ProductFormValues,
} from "./productForm";

const valid: ProductFormValues = {
  sku: "SKU-NEW1",
  name: "新品",
  price: "25.5",
  stock: "8",
  status: "on",
};

const errorOf = (patch: Partial<ProductFormValues>, field: keyof ProductFormValues) => {
  const result = productFormSchema.safeParse({ ...valid, ...patch });
  return result.success
    ? undefined
    : result.error.issues.find((issue) => issue.path[0] === field)?.message;
};

describe("sanitize", () => {
  it.each([
    [sanitizeSku, "SKU 1!@#中文_a-b", "SKU1_a-b"],
    [sanitizeSku, "x".repeat(40), "x".repeat(32)],
    [sanitizeName, "y".repeat(60), "y".repeat(50)],
    [sanitizePrice, "32.3sadfasfd", "32.3"],
    [sanitizePrice, "1.2.3", "1.23"],
    [sanitizePrice, "1.234", "1.23"],
    [sanitizePrice, "-5", "5"],
    [sanitizePrice, "1234567", "123456"],
    [sanitizeStock, "32323safasf", "32323"],
    [sanitizeStock, "1.5", "15"],
    [sanitizeStock, "-1", "1"],
    [sanitizeStock, "12345678", "123456"],
  ])("%o: %s -> %s", (fn, input, expected) => {
    expect(fn(input)).toBe(expected);
  });
});

describe("productFormSchema", () => {
  it("trims text and converts yuan to cents without float drift", () => {
    expect(
      productFormSchema.parse({
        ...valid,
        sku: " SKU-NEW1 ",
        name: " 新品 ",
        price: "19.9",
      }),
    ).toEqual({ sku: "SKU-NEW1", name: "新品", price: 1990, stock: 8, status: "on" });
    expect(productFormSchema.parse({ ...valid, price: "0.29" }).price).toBe(29);
  });

  it.each([
    ["sku", { sku: "" }, "请输入 SKU"],
    ["name", { name: "   " }, "请输入商品名称"],
    ["price", { price: "" }, "请输入价格"],
    ["price", { price: "." }, "价格格式不正确：最多两位小数，整数部分不能以 0 开头"],
    ["price", { price: "1." }, "价格格式不正确：最多两位小数，整数部分不能以 0 开头"],
    ["price", { price: "007" }, "价格格式不正确：最多两位小数，整数部分不能以 0 开头"],
    ["price", { price: "1000000" }, "价格不能超过 999999.99"],
    ["stock", { stock: "" }, "请输入库存"],
    ["stock", { stock: "007" }, "库存必须是非负整数，且不能以 0 开头"],
    ["stock", { stock: "1000000" }, "库存不能超过 999999"],
  ] as const)("%s %j -> %s", (field, patch, message) => {
    expect(errorOf(patch, field)).toBe(message);
  });

  it("accepts boundary values", () => {
    for (const patch of [
      { price: "0", stock: "0" },
      { price: "0.5" },
      { price: "999999.99", stock: "999999" },
    ]) {
      expect(productFormSchema.safeParse({ ...valid, ...patch }).success).toBe(true);
    }
  });

  it("reports every invalid field at once", () => {
    const result = productFormSchema.safeParse({
      sku: "a b",
      name: " ",
      price: "1.234",
      stock: "-1",
      status: "off",
    });
    expect(
      !result.success && [...new Set(result.error.issues.map((i) => i.path[0]))].sort(),
    ).toEqual(["name", "price", "sku", "stock"]);
  });
});

describe("productToFormValues", () => {
  it("converts cents back to yuan and round-trips through the schema", () => {
    const values = productToFormValues({
      id: "product-1",
      merchantId: "merchant-east",
      sku: "SKU-E0001",
      name: "手冲咖啡豆",
      price: 1805,
      stock: 12,
      status: "off",
    });
    expect(values).toEqual({
      sku: "SKU-E0001",
      name: "手冲咖啡豆",
      price: "18.05",
      stock: "12",
      status: "off",
    });
    expect(productFormSchema.parse(values)).toEqual({
      sku: "SKU-E0001",
      name: "手冲咖啡豆",
      price: 1805,
      stock: 12,
      status: "off",
    });
  });
});
