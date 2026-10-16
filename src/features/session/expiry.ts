import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router";
import { onSessionExpired } from "@/shared/api/sessionExpiry";
import { notifyWarning } from "@/shared/ui/toast";
import { sessionQueryKey } from "./queries";

// 会话过期：清缓存、提示、回登录页。放在受保护区域的守卫里调用一次。
export function useSessionExpiry() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  useEffect(
    () =>
      onSessionExpired(() => {
        // 只有确实登录过（缓存里有会话）才提示；首次访问未登录的 401 不提示。
        // 多个请求同时 401 时，首个事件清缓存后，后续事件不会再提示。
        const hadSession = queryClient.getQueryData(sessionQueryKey) !== undefined;
        queryClient.clear();
        if (hadSession) {
          // 固定 id：同一时间只存在一条，作为去重的第二层兜底。
          notifyWarning("登录已过期，请重新登录。", { id: "session-expired" });
        }
        navigate("/login", { replace: true });
      }),
    [navigate, queryClient],
  );
}
