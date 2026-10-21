import type { SettlementStatus } from "@merchant/contracts";

export type {
  Settlement,
  SettlementListResponse,
  SettlementStatus,
} from "@merchant/contracts";

export type SettlementStatusFilter = "all" | SettlementStatus;

export interface SettlementFilters {
  status: SettlementStatusFilter;
  page: number;
  pageSize: number;
}

const DEFAULT_PAGE_SIZE = 10;
const MAX_PAGE_SIZE = 20;

export function parseSettlementFilters(params: URLSearchParams): SettlementFilters {
  const rawPage = Number(params.get("page"));
  const rawPageSize = Number(params.get("pageSize"));
  const status = params.get("status");
  return {
    status: status === "pending" || status === "paid" ? status : "all",
    page: Number.isInteger(rawPage) && rawPage > 0 ? rawPage : 1,
    pageSize:
      Number.isInteger(rawPageSize) && rawPageSize > 0
        ? Math.min(rawPageSize, MAX_PAGE_SIZE)
        : DEFAULT_PAGE_SIZE,
  };
}
