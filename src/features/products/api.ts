import { apiRequest } from "@/shared/api/request";
import type { NewProduct, Product, ProductFilters, ProductListResponse } from "./types";

export function getProducts(
  merchantId: string,
  filters: ProductFilters,
  signal?: AbortSignal,
) {
  return apiRequest<ProductListResponse>({
    url: `/api/merchants/${merchantId}/products`,
    params: {
      status: filters.status,
      q: filters.q,
      page: filters.page,
      pageSize: filters.pageSize,
    },
    signal,
  });
}

export function createProduct(merchantId: string, input: NewProduct) {
  return apiRequest<Product>({
    url: `/api/merchants/${merchantId}/products`,
    method: "POST",
    data: input,
  });
}

export function updateProduct(merchantId: string, productId: string, input: NewProduct) {
  return apiRequest<Product>({
    url: `/api/merchants/${merchantId}/products/${productId}`,
    method: "PUT",
    data: input,
  });
}
