import type { OrderFilters } from "./types";

export const orderKeys = {
  all: ["orders"] as const,
  lists: () => [...orderKeys.all, "list"] as const,
  merchantLists: (merchantId: string) => [...orderKeys.lists(), merchantId] as const,
  list: (merchantId: string, filters: OrderFilters) =>
    [
      ...orderKeys.merchantLists(merchantId),
      filters.status,
      filters.q,
      filters.page,
      filters.pageSize,
    ] as const,
  details: () => [...orderKeys.all, "detail"] as const,
  detail: (merchantId: string, orderId: string) =>
    [...orderKeys.details(), merchantId, orderId] as const,
};
