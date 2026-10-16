import { apiRequest } from "@/shared/api/request";
import type { Order, OrderStatus } from "@/entities/order";
import type { OrderFilters, OrderListResponse } from "./types";

export function getOrders(
  merchantId: string,
  filters: OrderFilters,
  signal?: AbortSignal,
) {
  return apiRequest<OrderListResponse>({
    url: `/api/merchants/${merchantId}/orders`,
    params: {
      status: filters.status,
      q: filters.q,
      page: filters.page,
      pageSize: filters.pageSize,
    },
    signal,
  });
}

export function getOrder(merchantId: string, orderId: string, signal?: AbortSignal) {
  return apiRequest<Order>({
    url: `/api/merchants/${merchantId}/orders/${orderId}`,
    signal,
  });
}

export function updateOrderStatus(
  merchantId: string,
  orderId: string,
  status: OrderStatus,
  expectedVersion: number,
) {
  return apiRequest<Order>({
    url: `/api/merchants/${merchantId}/orders/${orderId}/status`,
    method: "PATCH",
    data: { status, expectedVersion },
  });
}

export function deleteOrder(merchantId: string, orderId: string) {
  return apiRequest<void>({
    url: `/api/merchants/${merchantId}/orders/${orderId}`,
    method: "DELETE",
  });
}
