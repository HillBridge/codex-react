const SESSION_EXPIRED_EVENT = "app:session-expired";

// 请求层发现 401 时调用；请求层不依赖路由和缓存，只负责广播。
export function emitSessionExpired() {
  window.dispatchEvent(new Event(SESSION_EXPIRED_EVENT));
}

// 返回取消订阅函数，方便在 effect 中清理。
export function onSessionExpired(handler: () => void) {
  window.addEventListener(SESSION_EXPIRED_EVENT, handler);
  return () => window.removeEventListener(SESSION_EXPIRED_EVENT, handler);
}
