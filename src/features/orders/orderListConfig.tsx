import { Link } from "react-router";
import type { DataTableColumn } from "@/shared/ui/data-table";
import type { TableFilterField } from "@/shared/ui/table-filter";
import type { Order, OrderStatus } from "./types";

const statusLabels: Record<OrderStatus, string> = {
  pending: "待处理",
  confirmed: "已确认",
  cancelled: "已取消",
};

export const orderColumns: DataTableColumn<Order>[] = [
  { key: "number", header: "订单号", isRowHeader: true, cell: (order) => order.number },
  {
    key: "createdAt",
    header: "创建时间",
    cell: (order) => new Date(order.createdAt).toLocaleString("zh-CN"),
  },
  {
    key: "amount",
    header: "金额",
    cell: (order) => `¥${(order.amount / 100).toFixed(2)}`,
  },
  { key: "status", header: "状态", cell: (order) => statusLabels[order.status] },
  {
    key: "actions",
    header: "操作",
    cell: (order) => <Link to={order.id}>查看详情</Link>,
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
      ...Object.entries(statusLabels).map(([id, label]) => ({ id, label })),
    ],
  },
];
