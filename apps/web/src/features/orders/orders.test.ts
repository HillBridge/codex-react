import { describe, expect, it } from "vitest";
import { orderKeys } from "./queryKeys";
import { parseOrderFilters } from "./types";

describe("parseOrderFilters", () => {
  it("preserves valid filters and normalizes invalid values", () => {
    expect(
      parseOrderFilters(
        new URLSearchParams("status=pending&q=%20abc%20&page=2&pageSize=10"),
      ),
    ).toEqual({
      status: "pending",
      q: "abc",
      page: 2,
      pageSize: 10,
    });
    expect(
      parseOrderFilters(new URLSearchParams("status=bad&page=-2&pageSize=100")),
    ).toEqual({
      status: "all",
      q: "",
      page: 1,
      pageSize: 20,
    });
    expect(parseOrderFilters(new URLSearchParams("")).pageSize).toBe(10);
  });
});

describe("orderKeys", () => {
  it("isolates merchant and every list filter", () => {
    const base = { status: "all" as const, q: "", page: 1, pageSize: 20 };
    const key = orderKeys.list("merchant-east", base);
    expect(orderKeys.list("merchant-west", base)).not.toEqual(key);
    expect(orderKeys.list("merchant-east", { ...base, page: 2 })).not.toEqual(key);
    expect(orderKeys.list("merchant-east", { ...base, q: "abc" })).not.toEqual(key);
  });
});
