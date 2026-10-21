import { describe, expect, it } from "vitest";
import { productKeys } from "./queryKeys";
import { parseProductFilters } from "./types";

describe("parseProductFilters", () => {
  it("normalizes invalid values and defaults to 10 per page", () => {
    expect(
      parseProductFilters(new URLSearchParams("status=bad&page=-2&q=%20a%20")),
    ).toEqual({
      status: "all",
      q: "a",
      page: 1,
      pageSize: 10,
    });
    expect(parseProductFilters(new URLSearchParams("pageSize=100")).pageSize).toBe(20);
    expect(parseProductFilters(new URLSearchParams("status=off")).status).toBe("off");
  });
});

describe("productKeys", () => {
  it("isolates merchant and every list filter", () => {
    const base = { status: "all" as const, q: "", page: 1, pageSize: 10 };
    const key = productKeys.list("merchant-east", base);
    expect(productKeys.list("merchant-west", base)).not.toEqual(key);
    expect(productKeys.list("merchant-east", { ...base, page: 2 })).not.toEqual(key);
    expect(productKeys.list("merchant-east", { ...base, status: "on" })).not.toEqual(key);
  });
});
