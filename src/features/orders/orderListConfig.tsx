import { Link } from "react-router";
import { Button } from "@/shared/ui/button";
import { TableActions, type DataTableColumn } from "@/shared/ui/data-table";
import type { TableFilterField } from "@/shared/ui/table-filter";
import {
  formatOrderAmount,
  formatOrderTime,
  orderStatusLabels,
  type Order,
} from "@/entries/order";

interface OrderColumnOptions {
  canDelete: boolean;
  onDelete: (order: Order) => void;
}

export const getOrderColumns = ({
  canDelete,
  onDelete,
}: OrderColumnOptions): DataTableColumn<Order>[] => [
  { key: "number", header: "订单号", isRowHeader: true, cell: (order) => order.number },
  {
    key: "createdAt",
    header: "创建时间",
    cell: (order) => formatOrderTime(order.createdAt),
  },
  {
    key: "amount",
    header: "金额",
    cell: (order) => formatOrderAmount(order.amount),
  },
  { key: "status", header: "状态", cell: (order) => orderStatusLabels[order.status] },
  {
    key: "actions",
    header: "操作",
    cell: (order) => (
      <TableActions>
        <Link to={order.id}>查看详情</Link>
        {canDelete ? (
          <Button
            variant="secondary"
            aria-label={`删除订单 ${order.number}`}
            onPress={() => onDelete(order)}
          >
            删除
          </Button>
        ) : null}
      </TableActions>
    ),
  },
];

export const orderTableFilterFields: TableFilterField[] = [
  {
    type: "search",
    key: "q",
    label: "订单号",
    ariaLabel: "搜索订单",
    placeholder: "输入订单号",
  },
  {
    type: "select",
    key: "status",
    label: "订单状态",
    options: [
      { id: "all", label: "全部状态" },
      ...Object.entries(orderStatusLabels).map(([id, label]) => ({ id, label })),
    ],
  },
];
