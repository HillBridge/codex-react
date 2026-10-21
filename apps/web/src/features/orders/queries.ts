import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { getOrder, getOrders } from "./api";
import { orderKeys } from "./queryKeys";
import type { OrderFilters } from "./types";

export const useOrders = (merchantId: string, filters: OrderFilters) =>
  useQuery({
    queryKey: orderKeys.list(merchantId, filters),
    queryFn: ({ signal }) => getOrders(merchantId, filters, signal),
    // 翻页、改筛选时先保留上一份数据，避免整张表被“加载中”替换而闪动。
    placeholderData: keepPreviousData,
  });

export const useOrder = (merchantId: string, orderId: string) =>
  useQuery({
    queryKey: orderKeys.detail(merchantId, orderId),
    queryFn: ({ signal }) => getOrder(merchantId, orderId, signal),
  });
