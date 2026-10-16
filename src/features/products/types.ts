export type ProductStatus = "on" | "off";
export type ProductStatusFilter = "all" | ProductStatus;

export interface Product {
  id: string;
  merchantId: string;
  sku: string;
  name: string;
  price: number;
  stock: number;
  status: ProductStatus;
}

export interface ProductFilters {
  status: ProductStatusFilter;
  q: string;
  page: number;
  pageSize: number;
}

export interface ProductListResponse {
  items: Product[];
  total: number;
  page: number;
  pageSize: number;
}

const DEFAULT_PAGE_SIZE = 10;
const MAX_PAGE_SIZE = 20;

export function parseProductFilters(params: URLSearchParams): ProductFilters {
  const rawPage = Number(params.get("page"));
  const rawPageSize = Number(params.get("pageSize"));
  const status = params.get("status");
  return {
    status: status === "on" || status === "off" ? status : "all",
    q: params.get("q")?.trim() ?? "",
    page: Number.isInteger(rawPage) && rawPage > 0 ? rawPage : 1,
    pageSize:
      Number.isInteger(rawPageSize) && rawPageSize > 0
        ? Math.min(rawPageSize, MAX_PAGE_SIZE)
        : DEFAULT_PAGE_SIZE,
  };
}
