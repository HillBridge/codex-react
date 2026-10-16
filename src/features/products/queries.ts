import { useQuery } from "@tanstack/react-query";
import { getProducts } from "./api";
import { productKeys } from "./queryKeys";
import type { ProductFilters } from "./types";

export const useProducts = (merchantId: string, filters: ProductFilters) =>
  useQuery({
    queryKey: productKeys.list(merchantId, filters),
    queryFn: ({ signal }) => getProducts(merchantId, filters, signal),
  });
