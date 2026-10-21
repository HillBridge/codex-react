import { describe, expect, it } from "vitest";
import { settlementKeys } from "./queryKeys";
import { parseSettlementFilters } from "./types";

describe("parseSettlementFilters", () => {
  it("normalizes invalid values and defaults to 10 per page", () => {
    expect(parseSettlementFilters(new URLSearchParams("status=bad&page=0"))).toEqual({
      status: "all",
      page: 1,
      pageSize: 10,
    });
    expect(parseSettlementFilters(new URLSearchParams("status=paid")).status).toBe(
      "paid",
    );
  });
});

describe("settlementKeys", () => {
  it("keeps list and order caches apart and isolates merchants", () => {
    const filters = { status: "all" as const, page: 1, pageSize: 10 };
    const list = settlementKeys.list("merchant-east", filters);
    expect(settlementKeys.list("merchant-west", filters)).not.toEqual(list);
    expect(settlementKeys.orders("merchant-east", "settlement-1001")).not.toEqual(
      settlementKeys.orders("merchant-east", "settlement-1002"),
    );
    expect(list.slice(0, 2)).toEqual(["settlements", "list"]);
  });
});
