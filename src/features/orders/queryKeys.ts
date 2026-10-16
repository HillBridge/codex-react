import type { OrderFilters } from "./types";

// 键层级：orders → list/detail → merchantId → 具体条件。
// 失效时按前缀匹配，越靠前范围越大。
const ordersRoot = ["orders"] as const;
const listRoot = [...ordersRoot, "list"] as const;
const detailRoot = [...ordersRoot, "detail"] as const;

export const orderKeys = {
  // 某商户下所有列表（不区分筛选和分页），用于写操作后批量失效
  merchantLists: (merchantId: string) => [...listRoot, merchantId] as const,

  // 某一页具体的列表
  list: (merchantId: string, filters: OrderFilters) =>
    [
      ...orderKeys.merchantLists(merchantId),
      filters.status,
      filters.q,
      filters.page,
      filters.pageSize,
    ] as const,

  // 某一条订单详情
  detail: (merchantId: string, orderId: string) =>
    [...detailRoot, merchantId, orderId] as const,
};
