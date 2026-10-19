import { describe, expect, it } from "vitest";
import { overviewKeys } from "./queryKeys";

describe("overviewKeys", () => {
  it("isolates merchants", () => {
    expect(overviewKeys.merchant("merchant-east")).not.toEqual(
      overviewKeys.merchant("merchant-west"),
    );
  });
});
