import { apiRequest } from "../../shared/api/request";
import type { Order, OrderFilters, OrderListResponse, OrderStatus } from "./types";

export function getOrders(
  merchantId: string,
  filters: OrderFilters,
  signal?: AbortSignal,
) {
  const params = new URLSearchParams({
    status: filters.status,
    q: filters.q,
    page: String(filters.page),
    pageSize: String(filters.pageSize),
  });
  return apiRequest<OrderListResponse>(`/api/merchants/${merchantId}/orders?${params}`, {
    signal,
  });
}

export function getOrder(merchantId: string, orderId: string, signal?: AbortSignal) {
  return apiRequest<Order>(`/api/merchants/${merchantId}/orders/${orderId}`, { signal });
}

export function updateOrderStatus(
  merchantId: string,
  orderId: string,
  status: OrderStatus,
  expectedVersion: number,
) {
  return apiRequest<Order>(`/api/merchants/${merchantId}/orders/${orderId}/status`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status, expectedVersion }),
  });
}
