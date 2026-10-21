import { useSyncExternalStore } from "react";

// 与样式里 @media (max-width: 48rem) 保持一致的 H5 断点；样式断点只允许 48rem、64rem（见 stylelint 配置）。
export const MOBILE_QUERY = "(max-width: 48rem)";

function subscribe(query: string, onChange: () => void) {
  const list = window.matchMedia(query);
  list.addEventListener("change", onChange);
  return () => list.removeEventListener("change", onChange);
}

// 只在 CSS 无法表达差异（需要渲染不同组件、传不同 props）时使用；纯样式差异直接写 @media。
export function useMediaQuery(query: string) {
  return useSyncExternalStore(
    (onChange) =>
      typeof window.matchMedia === "function" ? subscribe(query, onChange) : () => {},
    () => typeof window.matchMedia === "function" && window.matchMedia(query).matches,
    () => false,
  );
}

export function useIsMobile() {
  return useMediaQuery(MOBILE_QUERY);
}
