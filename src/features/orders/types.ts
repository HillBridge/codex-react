import type { Order, OrderStatus } from "@/entities/order";

export type OrderStatusFilter = "all" | OrderStatus;

export interface OrderFilters {
  status: OrderStatusFilter;
  q: string;
  page: number;
  pageSize: number;
}

export interface OrderListResponse {
  items: Order[];
  total: number;
  page: number;
  pageSize: number;
}

const DEFAULT_PAGE_SIZE = 10;
const MAX_PAGE_SIZE = 20;

export function parseOrderFilters(params: URLSearchParams): OrderFilters {
  const rawPage = Number(params.get("page"));
  const rawPageSize = Number(params.get("pageSize"));
  const status = params.get("status");
  return {
    status: ["pending", "confirmed", "cancelled"].includes(status ?? "")
      ? (status as OrderStatus)
      : "all",
    q: params.get("q")?.trim() ?? "",
    page: Number.isInteger(rawPage) && rawPage > 0 ? rawPage : 1,
    pageSize:
      Number.isInteger(rawPageSize) && rawPageSize > 0
        ? Math.min(rawPageSize, MAX_PAGE_SIZE)
        : DEFAULT_PAGE_SIZE,
  };
}
