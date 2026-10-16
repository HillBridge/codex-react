import { useQuery } from "@tanstack/react-query";
import { getSettlementOrders, getSettlements } from "./api";
import { settlementKeys } from "./queryKeys";
import type { SettlementFilters } from "./types";

export const useSettlements = (merchantId: string, filters: SettlementFilters) =>
  useQuery({
    queryKey: settlementKeys.list(merchantId, filters),
    queryFn: ({ signal }) => getSettlements(merchantId, filters, signal),
  });

// settlementId 为空表示弹框未打开，不发请求。
export const useSettlementOrders = (merchantId: string, settlementId: string | null) =>
  useQuery({
    queryKey: settlementKeys.orders(merchantId, settlementId ?? ""),
    queryFn: ({ signal }) => getSettlementOrders(merchantId, settlementId!, signal),
    enabled: settlementId !== null,
  });
