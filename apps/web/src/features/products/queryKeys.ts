import type { ProductFilters } from "./types";

// 键层级：products → list → merchantId → 具体条件。
const productsRoot = ["products"] as const;
const listRoot = [...productsRoot, "list"] as const;

export const productKeys = {
  // 某商户下所有列表（不区分筛选和分页）
  merchantLists: (merchantId: string) => [...listRoot, merchantId] as const,

  // 某一页具体的列表
  list: (merchantId: string, filters: ProductFilters) =>
    [
      ...productKeys.merchantLists(merchantId),
      filters.status,
      filters.q,
      filters.page,
      filters.pageSize,
    ] as const,
};
