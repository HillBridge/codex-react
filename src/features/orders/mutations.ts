import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ApiError } from "@/shared/api/ApiError";
import { notifyError } from "@/shared/ui/toast";
import { updateOrderStatus } from "./api";
import { orderKeys } from "./queryKeys";
import type { OrderStatus } from "./types";

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
    onSuccess: (_order, input) => {
      void queryClient.invalidateQueries({
        queryKey: orderKeys.merchantLists(input.merchantId),
      });
      void queryClient.invalidateQueries({
        queryKey: orderKeys.detail(input.merchantId, input.orderId),
      });
    },
    onError: (error, input) => {
      // 409 冲突由详情页的 Alert 展示；其余失败用 toast。
      if (!(error instanceof ApiError && error.status === 409)) {
        notifyError({
          message: error.message,
          requestId: error instanceof ApiError ? error.requestId : undefined,
        });
      }
      void queryClient.invalidateQueries({
        queryKey: orderKeys.merchantLists(input.merchantId),
      });
      void queryClient.invalidateQueries({
        queryKey: orderKeys.detail(input.merchantId, input.orderId),
      });
    },
  });
}
