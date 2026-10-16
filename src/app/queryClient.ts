import axios from "axios";
import { MutationCache, QueryCache, QueryClient } from "@tanstack/react-query";
import { ApiError } from "@/shared/api/ApiError";
import { notifyError } from "@/shared/ui/toast";

// 401 已由会话过期机制（emitSessionExpired）跳转登录；meta.silent 表示调用方自行展示错误。
// 决定一个错误要不要弹 toast
function notify(error: Error, meta: Record<string, unknown> | undefined) {
  if (meta?.silent) return;
  if (axios.isCancel(error)) return;
  if (error instanceof ApiError) {
    if (error.status === 401) return;
    notifyError({ message: error.message, requestId: error.requestId });
    return;
  }
  notifyError({ message: "发生未知错误，请稍后重试。" });
}

export function createAppQueryClient() {
  // 配置全局的缓存策略、重试策略、错误处理回调等。
  return new QueryClient({
    queryCache: new QueryCache({
      // 首次加载失败（无旧数据）由页面自己展示；已有数据时刷新失败才需要 toast。
      onError: (error, query) => {
        if (query.state.data === undefined) return;
        notify(error, query.meta);
      },
    }),
    mutationCache: new MutationCache({
      onError: (error, _variables, _context, mutation) =>
        notify(error, mutation.options.meta),
    }),
    defaultOptions: {
      queries: {
        staleTime: 30_000,
        retry: (failureCount, error) =>
          !(error instanceof ApiError && error.status === 401) && failureCount < 1,
      },
      mutations: { retry: false },
    },
  });
}

export const appQueryClient = createAppQueryClient();
