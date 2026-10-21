import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { getSettlementOrders, getSettlements } from "./api";
import { settlementKeys } from "./queryKeys";
import type { SettlementFilters } from "./types";

export const useSettlements = (merchantId: string, filters: SettlementFilters) =>
  useQuery({
    queryKey: settlementKeys.list(merchantId, filters),
    queryFn: ({ signal }) => getSettlements(merchantId, filters, signal),
    // 翻页、改筛选时先保留上一份数据，避免整张表被“加载中”替换而闪动。
    placeholderData: keepPreviousData,
  });

// settlementId 为空表示弹框未打开，不发请求。
export const useSettlementOrders = (merchantId: string, settlementId: string | null) =>
  useQuery({
    queryKey: settlementKeys.orders(merchantId, settlementId ?? ""),
    queryFn: ({ signal }) => getSettlementOrders(merchantId, settlementId!, signal),
    enabled: settlementId !== null,
  });
