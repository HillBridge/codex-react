import { useQuery } from "@tanstack/react-query";
import { getOrder, getOrders } from "./api";
import { orderKeys } from "./queryKeys";
import type { OrderFilters } from "./types";

export const useOrders = (merchantId: string, filters: OrderFilters) =>
  useQuery({
    queryKey: orderKeys.list(merchantId, filters),
    queryFn: ({ signal }) => getOrders(merchantId, filters, signal),
  });

export const useOrder = (merchantId: string, orderId: string) =>
  useQuery({
    queryKey: orderKeys.detail(merchantId, orderId),
    queryFn: ({ signal }) => getOrder(merchantId, orderId, signal),
  });
