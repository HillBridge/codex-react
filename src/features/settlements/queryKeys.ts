import type { SettlementFilters } from "./types";

// 键层级：settlements → list/orders → merchantId → 具体条件。
const settlementsRoot = ["settlements"] as const;
const listRoot = [...settlementsRoot, "list"] as const;
const ordersRoot = [...settlementsRoot, "orders"] as const;

export const settlementKeys = {
  // 某商户下所有结算列表（不区分筛选和分页）
  merchantLists: (merchantId: string) => [...listRoot, merchantId] as const,

  // 某一页具体的结算列表
  list: (merchantId: string, filters: SettlementFilters) =>
    [
      ...settlementKeys.merchantLists(merchantId),
      filters.status,
      filters.page,
      filters.pageSize,
    ] as const,

  // 某个结算单包含的订单
  orders: (merchantId: string, settlementId: string) =>
    [...ordersRoot, merchantId, settlementId] as const,
};
