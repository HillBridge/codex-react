import { useState } from "react";
import { useSession } from "@/features/session";
import {
  getSettlementColumns,
  parseSettlementFilters,
  SettlementOrders,
  settlementTableFilterFields,
  useSettlements,
  type Settlement,
} from "@/features/settlements";
import { useUrlParams } from "@/shared/hooks/useUrlParams";
import { DataTable } from "@/shared/ui/data-table";
import { Pagination } from "@/shared/ui/pagination";
import { StatusPanel } from "@/shared/ui/status-panel";
import { TableFilter } from "@/shared/ui/table-filter";

export function SettlementsPage() {
  const merchant = useSession().data!.merchant;
  const { params, update, setPage, reset } = useUrlParams();
  const filters = parseSettlementFilters(params);
  const query = useSettlements(merchant.id, filters);
  const [viewing, setViewing] = useState<Settlement | null>(null);
  const columns = getSettlementColumns({ onViewOrders: setViewing });

  return (
    <>
      <TableFilter
        fields={settlementTableFilterFields}
        values={{ status: filters.status }}
        onChange={update}
        onReset={reset}
      />
      {query.isPending ? (
        <StatusPanel kind="loading" title="正在加载结算单" />
      ) : query.isError && !query.data ? (
        <StatusPanel
          kind="error"
          title="结算单加载失败"
          description={query.error.message}
          onRetry={() => void query.refetch()}
        />
      ) : query.data!.items.length ? (
        <DataTable
          ariaLabel="结算单列表"
          rows={query.data!.items}
          columns={columns}
          getRowId={(settlement) => settlement.id}
        />
      ) : (
        <StatusPanel kind="empty" title="没有符合条件的结算单" />
      )}
      {query.data ? (
        <Pagination
          page={filters.page}
          total={query.data.total}
          pageSize={filters.pageSize}
          onChange={setPage}
        />
      ) : null}
      <SettlementOrders
        merchantId={merchant.id}
        settlement={viewing}
        onClose={() => setViewing(null)}
      />
    </>
  );
}
