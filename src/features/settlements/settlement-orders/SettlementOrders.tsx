import {
  formatOrderAmount,
  formatOrderTime,
  orderStatusLabels,
  type Order,
} from "@/entries/order";
import { DataTable, type DataTableColumn } from "@/shared/ui/data-table";
import { Dialog } from "@/shared/ui/dialog";
import { StatusPanel } from "@/shared/ui/status-panel";
import { useSettlementOrders } from "../queries";
import type { Settlement } from "../types";

const columns: DataTableColumn<Order>[] = [
  { key: "number", header: "订单号", isRowHeader: true, cell: (order) => order.number },
  {
    key: "createdAt",
    header: "创建时间",
    cell: (order) => formatOrderTime(order.createdAt),
  },
  { key: "amount", header: "金额", cell: (order) => formatOrderAmount(order.amount) },
  { key: "status", header: "状态", cell: (order) => orderStatusLabels[order.status] },
];

interface SettlementOrdersProps {
  merchantId: string;
  settlement: Settlement | null;
  onClose: () => void;
}

export function SettlementOrders({
  merchantId,
  settlement,
  onClose,
}: SettlementOrdersProps) {
  const query = useSettlementOrders(merchantId, settlement?.id ?? null);
  return (
    <Dialog
      isOpen={settlement !== null}
      title={`结算单 ${settlement?.number ?? ""} 包含的订单`}
      size="wide"
      showCloseButton
      onClose={onClose}
    >
      {query.isPending ? (
        <StatusPanel kind="loading" title="正在加载订单" />
      ) : query.isError ? (
        <StatusPanel
          kind="error"
          title="订单加载失败"
          description={query.error.message}
          onRetry={() => void query.refetch()}
        />
      ) : query.data.items.length ? (
        <DataTable
          ariaLabel="结算订单列表"
          rows={query.data.items}
          columns={columns}
          getRowId={(order) => order.id}
        />
      ) : (
        <StatusPanel kind="empty" title="该结算单没有订单" />
      )}
    </Dialog>
  );
}
