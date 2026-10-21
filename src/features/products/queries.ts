import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { getProducts } from "./api";
import { productKeys } from "./queryKeys";
import type { ProductFilters } from "./types";

export const useProducts = (merchantId: string, filters: ProductFilters) =>
  useQuery({
    queryKey: productKeys.list(merchantId, filters),
    queryFn: ({ signal }) => getProducts(merchantId, filters, signal),
    // 翻页、改筛选时先保留上一份数据，避免整张表被“加载中”替换而闪动。
    placeholderData: keepPreviousData,
  });
