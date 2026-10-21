import { describe, expect, it } from "vitest";
import {
  orderListResponseSchema,
  overviewSchema,
  productListResponseSchema,
  sessionSchema,
  settlementListResponseSchema,
  updateOrderStatusInputSchema,
} from "./index";

describe("response contracts", () => {
  it("accepts a well-formed order list and rejects an unknown status", () => {
    const order = {
      id: "order-1",
      merchantId: "m1",
      number: "OD1",
      createdAt: "2026-10-12T08:30:00.000Z",
      amount: 100,
      status: "pending",
      version: 1,
    };
    const page = { items: [order], total: 1, page: 1, pageSize: 10 };
    expect(orderListResponseSchema.safeParse(page).success).toBe(true);
    expect(
      orderListResponseSchema.safeParse({
        ...page,
        items: [{ ...order, status: "shipped" }],
      }).success,
    ).toBe(false);
  });

  it("only allows confirming or cancelling an order", () => {
    expect(
      updateOrderStatusInputSchema.safeParse({ status: "confirmed", expectedVersion: 1 })
        .success,
    ).toBe(true);
    expect(
      updateOrderStatusInputSchema.safeParse({ status: "pending", expectedVersion: 1 })
        .success,
    ).toBe(false);
  });

  it("validates the other response shapes", () => {
    expect(
      settlementListResponseSchema.safeParse({
        items: [
          {
            id: "s1",
            number: "ST1",
            periodStart: "2026-10-01",
            periodEnd: "2026-10-07",
            status: "paid",
            orderCount: 2,
            amount: 300,
          },
        ],
        total: 1,
        page: 1,
        pageSize: 10,
      }).success,
    ).toBe(true);
    expect(productListResponseSchema.safeParse({ items: [] }).success).toBe(false);
    expect(overviewSchema.safeParse({}).success).toBe(false);
    expect(
      sessionSchema.safeParse({
        user: { id: "u", name: "n" },
        merchant: { id: "m", name: "n", permissions: ["order:read"] },
      }).success,
    ).toBe(true);
  });
});
