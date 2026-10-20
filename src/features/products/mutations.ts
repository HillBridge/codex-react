import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ApiError } from "@/shared/api/ApiError";
import { notifyError, notifySuccess } from "@/shared/ui/toast";
import { createProduct } from "./api";
import { productKeys } from "./queryKeys";
import type { NewProduct } from "./types";

export function useCreateProduct() {
  const queryClient = useQueryClient();
  return useMutation({
    meta: { silent: true },
    mutationFn: (input: { merchantId: string; product: NewProduct }) =>
      createProduct(input.merchantId, input.product),
    onSuccess: (_product, input) => {
      notifySuccess("商品已创建");
      void queryClient.invalidateQueries({
        queryKey: productKeys.merchantLists(input.merchantId),
      });
    },
    onError: (error) => {
      // 校验失败和 SKU 重复由弹出框就地展示；其余失败用 toast。
      if (error instanceof ApiError && (error.status === 400 || error.status === 409)) {
        return;
      }
      notifyError({
        message: error.message,
        requestId: error instanceof ApiError ? error.requestId : undefined,
      });
    },
  });
}
