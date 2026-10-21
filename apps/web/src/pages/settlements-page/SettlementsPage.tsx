import { useMemo, useState } from "react";
import { useSession } from "@/features/session";
import {
  getSettlementColumns,
  parseSettlementFilters,
  SettlementOrders,
  settlementTableFilterFields,
  useSettlements,
  type Settlement,
} from "@/features/settlements";
import { SettlementSummary } from "@/widgets/settlement-summary";
import { useUrlParams } from "@/shared/hooks/useUrlParams";
import { DataTable } from "@/shared/ui/data-table";
import { Pagination } from "@/shared/ui/pagination";
import { StatusPanel } from "@/shared/ui/status-panel";
import { TableFilter } from "@/shared/ui/table-filter";

const getSettlementId = (settlement: Settlement) => settlement.id;

export function SettlementsPage() {
  const merchant = useSession().data!.merchant;
  const { params, update, setPage, reset } = useUrlParams();
  const filters = parseSettlementFilters(params);
  const query = useSettlements(merchant.id, filters);
  const [viewing, setViewing] = useState<Settlement | null>(null);
  // 引用稳定，弹窗开关引起的页面重渲染不会重绘表格。
  const columns = useMemo(() => getSettlementColumns({ onViewOrders: setViewing }), []);

  return (
    <>
      <SettlementSummary merchantId={merchant.id} showLink={false} />
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
          getRowId={getSettlementId}
          isRefreshing={query.isPlaceholderData}
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
