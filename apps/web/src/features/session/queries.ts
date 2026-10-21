import { queryOptions, useQuery, type QueryClient } from "@tanstack/react-query";
import { getSession } from "./api";

export const sessionQueryKey = ["session"] as const;

export function sessionQueryOptions() {
  return queryOptions({
    queryKey: sessionQueryKey,
    queryFn: getSession, // queryKey不存在会执行 | staleTime 失效后也会执行
    meta: { silent: true },
    staleTime: 30_000,
    retry: (failureCount: number, error: { status?: number }) =>
      error.status !== 401 && failureCount < 1,
  });
}

export function useSession() {
  return useQuery(sessionQueryOptions());
}

// 登录/退出切换身份时调用：先取消在途请求，避免晚到的响应写回刚清空的缓存。
export async function resetQueryCache(queryClient: QueryClient) {
  await queryClient.cancelQueries();
  queryClient.clear();
}
