import { apiRequest } from "@/shared/api/request";
import type { Order } from "@/entities/order";
import type { SettlementFilters, SettlementListResponse } from "./types";

export function getSettlements(
  merchantId: string,
  filters: SettlementFilters,
  signal?: AbortSignal,
) {
  return apiRequest<SettlementListResponse>({
    url: `/api/merchants/${merchantId}/settlements`,
    params: {
      status: filters.status,
      page: filters.page,
      pageSize: filters.pageSize,
    },
    signal,
  });
}

export function getSettlementOrders(
  merchantId: string,
  settlementId: string,
  signal?: AbortSignal,
) {
  return apiRequest<{ items: Order[] }>({
    url: `/api/merchants/${merchantId}/settlements/${settlementId}/orders`,
    signal,
  });
}
