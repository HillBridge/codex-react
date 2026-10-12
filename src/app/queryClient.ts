import { QueryClient } from "@tanstack/react-query";
import { ApiError } from "../shared/api/ApiError";

export function createAppQueryClient() {
  return new QueryClient({
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
