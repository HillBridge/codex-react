import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ApiError } from "@/shared/api/ApiError";
import { notifyError, notifySuccess } from "@/shared/ui/toast";
import { saveBlob } from "@/shared/lib/download";
import { deleteOrder, exportOrders, updateOrderStatus } from "./api";
import type { OrderFilters } from "./types";
import type { OrderStatus } from "@/entries/order";
import { orderKeys } from "./queryKeys";

export function useUpdateOrderStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    meta: { silent: true },
    mutationFn: (input: {
      merchantId: string;
      orderId: string;
      status: OrderStatus;
      version: number;
    }) => updateOrderStatus(input.merchantId, input.orderId, input.status, input.version),
    onError: (error) => {
      // 409 冲突由详情页的 Alert 展示；其余失败用 toast。
      if (!(error instanceof ApiError && error.status === 409)) {
        notifyError({
          message: error.message,
          requestId: error instanceof ApiError ? error.requestId : undefined,
        });
      }
    },
    // 成功后数据已变，失败（多为 409 版本冲突）说明本地已过期，都需要重新拉取。
    onSettled: (_order, _error, input) => {
      void queryClient.invalidateQueries({
        queryKey: orderKeys.merchantLists(input.merchantId),
      });
      void queryClient.invalidateQueries({
        queryKey: orderKeys.detail(input.merchantId, input.orderId),
      });
    },
  });
}

export function useDeleteOrder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { merchantId: string; orderId: string }) =>
      deleteOrder(input.merchantId, input.orderId),
    onSuccess: () => notifySuccess("订单已删除"),
    // 成功后列表已变；失败（如 404 已被删除）也需要重新拉取。
    onSettled: (_data, _error, input) => {
      void queryClient.invalidateQueries({
        queryKey: orderKeys.merchantLists(input.merchantId),
      });
      void queryClient.removeQueries({
        queryKey: orderKeys.detail(input.merchantId, input.orderId),
      });
    },
  });
}

export function useExportOrders() {
  return useMutation({
    mutationFn: async (input: { merchantId: string; filters: OrderFilters }) => {
      saveBlob(await exportOrders(input.merchantId, input.filters), "orders.csv");
    },
    onSuccess: () => notifySuccess("订单已导出"),
  });
}
