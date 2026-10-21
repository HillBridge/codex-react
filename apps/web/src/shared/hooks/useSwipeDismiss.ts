import { useCallback, useEffect, useRef, useState } from "react";

type SwipeDirection = "left" | "down";

// 判定为滑动的最小位移（px），且主方向位移要明显大于另一轴，避免把滚动和点按当成关闭。
const MIN_DISTANCE = 60;
const AXIS_RATIO = 1.5;

// 手机上抽屉向左滑、底部弹层向下滑来关闭。返回回调 ref，挂到弹层元素（如 Modal）上；
// 弹层是打开后才挂载的，所以用回调 ref 而不是 useRef。
// 向下滑时，只有弹层内容已滚到顶才算关闭手势，否则是在滚动内容。
export function useSwipeDismiss(
  direction: SwipeDirection,
  onDismiss: () => void,
  enabled = true,
) {
  const [element, setElement] = useState<HTMLElement | null>(null);
  // 调用方常传内联函数；用 ref 持有最新的回调，避免它每次渲染变化而重新绑定监听、丢掉进行中的手势。
  const onDismissRef = useRef(onDismiss);
  useEffect(() => {
    onDismissRef.current = onDismiss;
  });
  const ref = useCallback((node: HTMLElement | null) => setElement(node), []);

  useEffect(() => {
    if (!element || !enabled) return;
    let start: { x: number; y: number } | null = null;

    const onStart = (event: TouchEvent) => {
      const touch = event.touches[0];
      const canStart = direction === "down" ? element.scrollTop <= 0 : true;
      start =
        touch && event.touches.length === 1 && canStart
          ? { x: touch.clientX, y: touch.clientY }
          : null;
    };
    const onEnd = (event: TouchEvent) => {
      const touch = event.changedTouches[0];
      if (!start || !touch) return;
      const dx = touch.clientX - start.x;
      const dy = touch.clientY - start.y;
      start = null;
      const [main, cross] = direction === "down" ? [dy, dx] : [-dx, dy];
      if (main >= MIN_DISTANCE && main > Math.abs(cross) * AXIS_RATIO)
        onDismissRef.current();
    };
    const onCancel = () => {
      start = null;
    };

    element.addEventListener("touchstart", onStart, { passive: true });
    element.addEventListener("touchend", onEnd, { passive: true });
    element.addEventListener("touchcancel", onCancel, { passive: true });
    return () => {
      element.removeEventListener("touchstart", onStart);
      element.removeEventListener("touchend", onEnd);
      element.removeEventListener("touchcancel", onCancel);
    };
  }, [element, enabled, direction]);

  return ref;
}
