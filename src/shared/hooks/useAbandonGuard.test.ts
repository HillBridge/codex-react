import { fireEvent, renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { useAbandonGuard } from "./useAbandonGuard";

function setup() {
  const { result } = renderHook(() => useAbandonGuard());
  const form = document.createElement("form");
  const inside = document.createElement("input");
  const cancel = document.createElement("button");
  cancel.dataset.abandon = "";
  form.append(inside, cancel);
  const outside = document.createElement("button");
  document.body.append(form, outside);
  result.current.formRef.current = form;
  return { guard: result.current, inside, cancel, outside };
}

afterEach(() => {
  document.body.replaceChildren();
});

describe("useAbandonGuard", () => {
  it("does not skip by default", () => {
    expect(setup().guard.shouldSkipBlur()).toBe(false);
  });

  it.each([
    ["a field inside the form", "inside", false],
    ["the abandon button", "cancel", true],
    ["an element outside the form", "outside", true],
  ] as const)("while the pointer is down on %s", (_name, key, expected) => {
    const { guard, ...elements } = setup();

    fireEvent.pointerDown(elements[key]);
    expect(guard.shouldSkipBlur()).toBe(expected);

    // 松开后恢复，之后的失焦照常校验。
    fireEvent.pointerUp(elements[key]);
    expect(guard.shouldSkipBlur()).toBe(false);
  });

  it("also resets when the pointer interaction is cancelled", () => {
    const { guard, outside } = setup();

    fireEvent.pointerDown(outside);
    fireEvent.pointerCancel(outside);

    expect(guard.shouldSkipBlur()).toBe(false);
  });
});
