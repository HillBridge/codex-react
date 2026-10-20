import { describe, expect, it } from "vitest";
import { productInputSchema } from "./product";

const valid = { sku: "SKU-NEW1", name: "新品", price: 2500, stock: 8, status: "on" };
const messageOf = (patch: object) => {
  const result = productInputSchema.safeParse({ ...valid, ...patch });
  return result.success ? undefined : result.error.issues[0].message;
};

describe("productInputSchema", () => {
  it("trims text and accepts boundary values", () => {
    expect(
      productInputSchema.parse({
        ...valid,
        sku: " A_b-1 ",
        name: ` ${"x".repeat(50)} `,
        price: 99_999_999,
        stock: 0,
      }),
    ).toMatchObject({ sku: "A_b-1", name: "x".repeat(50), price: 99_999_999, stock: 0 });
  });

  it.each([
    [{ sku: " " }, "请输入 SKU"],
    [{ sku: "A B" }, "SKU 只能包含字母、数字、下划线和短横线，最多 32 位"],
    [{ sku: "x".repeat(33) }, "SKU 只能包含字母、数字、下划线和短横线，最多 32 位"],
    [{ name: "  " }, "请输入商品名称"],
    [{ name: "x".repeat(51) }, "商品名称最多 50 个字"],
    [{ price: 10.5 }, "价格必须是整数（单位：分）"],
    [{ price: -1 }, "价格不能为负"],
    [{ price: 100_000_000 }, "价格不能超过 999999.99"],
    [{ price: "100" }, "价格必须是数字"],
    [{ stock: -1 }, "库存不能为负"],
    [{ stock: 1_000_000 }, "库存不能超过 999999"],
    [{ status: "draft" }, "商品状态只能是在售或已下架"],
  ])("rejects %j", (patch, message) => {
    expect(messageOf(patch)).toBe(message);
  });

  it("rejects a missing body", () => {
    expect(productInputSchema.safeParse(undefined).success).toBe(false);
  });
});
