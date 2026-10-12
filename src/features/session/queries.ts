import { queryOptions, useQuery } from "@tanstack/react-query";
import { getSession } from "./api";

export const sessionQueryKey = ["session"] as const;

export function sessionQueryOptions() {
  return queryOptions({
    queryKey: sessionQueryKey,
    queryFn: getSession,
    staleTime: 30_000,
    retry: (failureCount: number, error: { status?: number }) =>
      error.status !== 401 && failureCount < 1,
  });
}

export function useSession() {
  return useQuery(sessionQueryOptions());
}
