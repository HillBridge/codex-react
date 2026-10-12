import { useMutation, useQueryClient } from "@tanstack/react-query";
import { updateOrderStatus } from "./api";
import { orderKeys } from "./queryKeys";
import type { OrderStatus } from "./types";

export function useUpdateOrderStatus() {
  const queryClient = useQueryClient();
  return useMutation({
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
    onError: (_error, input) => {
      void queryClient.invalidateQueries({
        queryKey: orderKeys.merchantLists(input.merchantId),
      });
      void queryClient.invalidateQueries({
        queryKey: orderKeys.detail(input.merchantId, input.orderId),
      });
    },
  });
}
