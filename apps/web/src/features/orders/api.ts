import { apiRequest } from "@/shared/api/request";
import type { Order } from "@/entries/order";
import type { UpdateOrderStatusInput } from "@merchant/contracts";
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

// 导出符合筛选条件的全部订单，不带分页参数。
export function exportOrders(merchantId: string, filters: OrderFilters) {
  return apiRequest<Blob>({
    url: `/api/merchants/${merchantId}/orders/export`,
    params: { status: filters.status, q: filters.q },
    responseType: "blob",
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
  status: UpdateOrderStatusInput["status"],
  expectedVersion: number,
) {
  return apiRequest<Order>({
    url: `/api/merchants/${merchantId}/orders/${orderId}/status`,
    method: "PATCH",
    data: { status, expectedVersion } satisfies UpdateOrderStatusInput,
  });
}

export function deleteOrder(merchantId: string, orderId: string) {
  return apiRequest<void>({
    url: `/api/merchants/${merchantId}/orders/${orderId}`,
    method: "DELETE",
  });
}
