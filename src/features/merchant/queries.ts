import { queryOptions, useQuery } from "@tanstack/react-query";
import { getMerchants } from "./api";

export const merchantQueryKey = ["merchants"] as const;

export function merchantQueryOptions() {
  return queryOptions({
    queryKey: merchantQueryKey,
    queryFn: getMerchants,
    retry: (failureCount: number, error: { status?: number }) =>
      error.status !== 401 && failureCount < 1,
  });
}

export function useMerchants() {
  return useQuery(merchantQueryOptions());
}
