import { useEffect, useRef } from "react";

// 用户点在表单之外（遮罩、标题）或带 data-abandon 的元素（如“取消”）上，是在放弃填写，
// 由此引起的输入框失焦不该触发校验。失焦发生在按下与松开之间，所以按下时记下、松开时清除。
export function useAbandonGuard() {
  const formRef = useRef<HTMLFormElement>(null);
  const abandoning = useRef(false);

  useEffect(() => {
    const onDown = (event: PointerEvent) => {
      const target = event.target as Element | null;
      abandoning.current =
        !formRef.current?.contains(target) || Boolean(target?.closest("[data-abandon]"));
    };
    const onUp = () => {
      abandoning.current = false;
    };
    document.addEventListener("pointerdown", onDown, true);
    document.addEventListener("pointerup", onUp, true);
    document.addEventListener("pointercancel", onUp, true);
    return () => {
      document.removeEventListener("pointerdown", onDown, true);
      document.removeEventListener("pointerup", onUp, true);
      document.removeEventListener("pointercancel", onUp, true);
    };
  }, []);

  return { formRef, shouldSkipBlur: () => abandoning.current };
}
