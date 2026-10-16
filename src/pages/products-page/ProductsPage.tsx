import { useSession } from "@/features/session";
import {
  parseProductFilters,
  productColumns,
  productTableFilterFields,
  useProducts,
} from "@/features/products";
import { useUrlParams } from "@/shared/hooks/useUrlParams";
import { DataTable } from "@/shared/ui/data-table";
import { Pagination } from "@/shared/ui/pagination";
import { StatusPanel } from "@/shared/ui/status-panel";
import { TableFilter } from "@/shared/ui/table-filter";

export function ProductsPage() {
  const merchant = useSession().data!.merchant;
  const { params, update, setPage, reset } = useUrlParams();
  const filters = parseProductFilters(params);
  const query = useProducts(merchant.id, filters);

  return (
    <>
      <TableFilter
        fields={productTableFilterFields}
        values={{ q: filters.q, status: filters.status }}
        onChange={update}
        onReset={reset}
      />
      {query.isPending ? (
        <StatusPanel kind="loading" title="正在加载商品" />
      ) : query.isError && !query.data ? (
        <StatusPanel
          kind="error"
          title="商品加载失败"
          description={query.error.message}
          onRetry={() => void query.refetch()}
        />
      ) : query.data!.items.length ? (
        <DataTable
          ariaLabel="商品列表"
          rows={query.data!.items}
          columns={productColumns}
          getRowId={(product) => product.id}
        />
      ) : (
        <StatusPanel kind="empty" title="没有符合条件的商品" />
      )}
      {query.data ? (
        <Pagination
          page={filters.page}
          total={query.data.total}
          pageSize={filters.pageSize}
          onChange={setPage}
        />
      ) : null}
    </>
  );
}
