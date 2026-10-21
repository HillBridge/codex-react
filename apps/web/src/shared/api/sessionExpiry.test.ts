import { describe, expect, it, vi } from "vitest";
import { emitSessionExpired, onSessionExpired } from "./sessionExpiry";

describe("sessionExpiry", () => {
  it("notifies subscribers and stops after unsubscribe", () => {
    const handler = vi.fn();
    const unsubscribe = onSessionExpired(handler);

    emitSessionExpired();
    unsubscribe();
    emitSessionExpired();

    expect(handler).toHaveBeenCalledTimes(1);
  });
});
