import { MutationCache, QueryCache, QueryClient } from "@tanstack/react-query";
import { ApiError } from "../shared/api/ApiError";
import { notifyError } from "../shared/ui/toast";

// 401 已由 app:session-expired 跳转登录；meta.silent 表示调用方自行展示错误。
function notify(error: Error, meta: Record<string, unknown> | undefined) {
  if (meta?.silent) return;
  if (error instanceof DOMException && error.name === "AbortError") return;
  if (error instanceof ApiError) {
    if (error.status === 401) return;
    notifyError({ message: error.message, requestId: error.requestId });
    return;
  }
  notifyError({ message: "发生未知错误，请稍后重试。" });
}

export function createAppQueryClient() {
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
