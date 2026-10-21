import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { useSwipeDismiss } from "./useSwipeDismiss";

function Sheet({
  direction,
  onDismiss,
  enabled,
}: {
  direction: "left" | "down";
  onDismiss: () => void;
  enabled?: boolean;
}) {
  const ref = useSwipeDismiss(direction, onDismiss, enabled);
  return (
    <div data-testid="sheet" ref={ref}>
      内容
    </div>
  );
}

function swipe(from: [number, number], to: [number, number]) {
  const sheet = screen.getByTestId("sheet");
  fireEvent.touchStart(sheet, { touches: [{ clientX: from[0], clientY: from[1] }] });
  fireEvent.touchEnd(sheet, { changedTouches: [{ clientX: to[0], clientY: to[1] }] });
}

describe("useSwipeDismiss", () => {
  it("关闭向下滑动的底部弹层", () => {
    const onDismiss = vi.fn();
    render(<Sheet direction="down" onDismiss={onDismiss} />);

    swipe([100, 100], [105, 200]);

    expect(onDismiss).toHaveBeenCalledTimes(1);
  });

  it("关闭向左滑动的抽屉", () => {
    const onDismiss = vi.fn();
    render(<Sheet direction="left" onDismiss={onDismiss} />);

    swipe([200, 100], [100, 110]);

    expect(onDismiss).toHaveBeenCalledTimes(1);
  });

  it("位移太短、方向不对或斜着滑动都不关闭", () => {
    const onDismiss = vi.fn();
    render(<Sheet direction="down" onDismiss={onDismiss} />);

    swipe([100, 100], [100, 130]);
    swipe([100, 200], [100, 100]);
    swipe([100, 100], [220, 200]);

    expect(onDismiss).not.toHaveBeenCalled();
  });

  it("内容没滚到顶时向下滑是在滚动，不关闭", () => {
    const onDismiss = vi.fn();
    render(<Sheet direction="down" onDismiss={onDismiss} />);
    screen.getByTestId("sheet").scrollTop = 40;

    swipe([100, 100], [100, 220]);

    expect(onDismiss).not.toHaveBeenCalled();
  });

  it("未启用时不响应", () => {
    const onDismiss = vi.fn();
    render(<Sheet direction="down" enabled={false} onDismiss={onDismiss} />);

    swipe([100, 100], [100, 220]);

    expect(onDismiss).not.toHaveBeenCalled();
  });
});
