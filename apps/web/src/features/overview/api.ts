import { apiRequest } from "@/shared/api/request";
import type { Overview } from "./types";

export function getOverview(merchantId: string, signal?: AbortSignal) {
  return apiRequest<Overview>({
    url: `/api/merchants/${merchantId}/overview`,
    signal,
  });
}
