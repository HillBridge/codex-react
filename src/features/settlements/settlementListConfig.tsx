import { formatCents } from "@/shared/lib/format";
import { Button } from "@/shared/ui/button";
import { TableActions, type DataTableColumn } from "@/shared/ui/data-table";
import type { TableFilterField } from "@/shared/ui/table-filter";
import type { Settlement, SettlementStatus } from "./types";

const statusLabels: Record<SettlementStatus, string> = {
  pending: "待结算",
  paid: "已结算",
};

export const getSettlementColumns = ({
  onViewOrders,
}: {
  onViewOrders: (settlement: Settlement) => void;
}): DataTableColumn<Settlement>[] => [
  {
    key: "number",
    header: "结算单号",
    isRowHeader: true,
    cell: (settlement) => settlement.number,
  },
  {
    key: "period",
    header: "结算周期",
    cell: (settlement) =>
      settlement.periodStart === settlement.periodEnd
        ? settlement.periodStart
        : `${settlement.periodStart} ~ ${settlement.periodEnd}`,
  },
  { key: "orderCount", header: "订单数", cell: (settlement) => settlement.orderCount },
  {
    key: "amount",
    header: "结算金额",
    cell: (settlement) => formatCents(settlement.amount),
  },
  {
    key: "status",
    header: "状态",
    cell: (settlement) => statusLabels[settlement.status],
  },
  {
    key: "actions",
    header: "操作",
    isActions: true,
    cell: (settlement) => (
      <TableActions>
        <Button
          variant="secondary"
          aria-label={`查看结算单 ${settlement.number} 的订单`}
          onPress={() => onViewOrders(settlement)}
        >
          查看订单
        </Button>
      </TableActions>
    ),
  },
];

export const settlementTableFilterFields: TableFilterField[] = [
  {
    type: "select",
    key: "status",
    label: "结算状态",
    options: [
      { id: "all", label: "全部状态" },
      ...Object.entries(statusLabels).map(([id, label]) => ({ id, label })),
    ],
  },
];
