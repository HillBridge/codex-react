import { describe, expect, it } from "vitest";
import {
  parseProductForm,
  sanitizeProductField,
  validateProductField,
  type ProductFormValues,
} from "./productForm";

const valid: ProductFormValues = {
  sku: "SKU-NEW1",
  name: "新品",
  price: "25.5",
  stock: "8",
  status: "on",
};

describe("sanitizeProductField", () => {
  it.each([
    ["sku", "SKU 1!@#中文_a-b", "SKU1_a-b"],
    ["sku", "x".repeat(40), "x".repeat(32)],
    ["name", "y".repeat(60), "y".repeat(50)],
    ["price", "32.3sadfasfd", "32.3"],
    ["price", "1.2.3", "1.23"],
    ["price", "1.234", "1.23"],
    ["price", "-5", "5"],
    ["price", "1234567", "123456"],
    ["stock", "32323safasf", "32323"],
    ["stock", "1.5", "15"],
    ["stock", "-1", "1"],
    ["stock", "12345678", "123456"],
  ] as const)("%s: %s -> %s", (key, input, expected) => {
    expect(sanitizeProductField(key, input)).toBe(expected);
  });
});

describe("validateProductField", () => {
  it.each([
    ["sku", "", "请输入 SKU"],
    ["name", "   ", "请输入商品名称"],
    ["price", "", "请输入价格"],
    ["price", ".", "价格格式不正确：最多两位小数，整数部分不能以 0 开头"],
    ["price", "1.", "价格格式不正确：最多两位小数，整数部分不能以 0 开头"],
    ["price", "007", "价格格式不正确：最多两位小数，整数部分不能以 0 开头"],
    ["price", "1000000", "价格不能超过 999999.99"],
    ["stock", "", "请输入库存"],
    ["stock", "007", "库存必须是非负整数，且不能以 0 开头"],
    ["stock", "1000000", "库存不能超过 999999"],
  ] as const)("%s %j -> %s", (key, value, message) => {
    expect(validateProductField(key, value)).toBe(message);
  });

  it.each([
    ["sku", "A_b-1"],
    ["name", "x".repeat(50)],
    ["price", "0"],
    ["price", "0.5"],
    ["price", "999999.99"],
    ["stock", "0"],
    ["stock", "999999"],
  ] as const)("accepts %s %j", (key, value) => {
    expect(validateProductField(key, value)).toBeUndefined();
  });
});

describe("parseProductForm", () => {
  it("trims text and converts yuan to cents without float drift", () => {
    expect(
      parseProductForm({ ...valid, sku: " SKU-NEW1 ", name: " 新品 ", price: "19.9" }),
    ).toEqual({
      ok: true,
      data: { sku: "SKU-NEW1", name: "新品", price: 1990, stock: 8, status: "on" },
    });
    expect(parseProductForm({ ...valid, price: "0.29" })).toMatchObject({
      data: { price: 29 },
    });
  });

  it("reports every invalid field at once", () => {
    const result = parseProductForm({
      sku: "a b",
      name: " ",
      price: "1.234",
      stock: "-1",
      status: "off",
    });
    expect(result.ok).toBe(false);
    expect(!result.ok && Object.keys(result.errors).sort()).toEqual([
      "name",
      "price",
      "sku",
      "stock",
    ]);
  });
});
