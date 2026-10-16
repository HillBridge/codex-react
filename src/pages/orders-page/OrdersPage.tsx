import { useSession } from "@/features/session";
import {
  orderColumns,
  orderTableFilterFields,
  useOrders,
  parseOrderFilters,
} from "@/features/orders";
import { useUrlParams } from "@/shared/hooks/useUrlParams";
import { DataTable } from "@/shared/ui/data-table";
import { TableFilter } from "@/shared/ui/table-filter";
import { Pagination } from "@/shared/ui/pagination";
import { StatusPanel } from "@/shared/ui/status-panel";

export function OrdersPage() {
  const merchant = useSession().data!.merchant;
  const { params, update, setPage, reset } = useUrlParams();
  const filters = parseOrderFilters(params);
  const query = useOrders(merchant.id, filters);

  return (
    <>
      <TableFilter
        fields={orderTableFilterFields}
        values={{ q: filters.q, status: filters.status }}
        onChange={update}
        onReset={reset}
      />
      {query.isPending ? (
        <StatusPanel kind="loading" title="正在加载订单" />
      ) : query.isError && !query.data ? (
        <StatusPanel
          kind="error"
          title="订单加载失败"
          description={query.error.message}
          onRetry={() => void query.refetch()}
        />
      ) : query.data!.items.length ? (
        <DataTable
          ariaLabel="订单列表"
          rows={query.data!.items}
          columns={orderColumns}
          getRowId={(order) => order.id}
        />
      ) : (
        <StatusPanel kind="empty" title="没有符合条件的订单" />
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
