import { Cell, Column, Row, Table, TableBody, TableHeader } from "react-aria-components";
import { Link } from "react-router";
import type { Order, OrderStatus } from "../types";
import styles from "./OrderTable.module.css";

const statusLabels: Record<OrderStatus, string> = {
  pending: "待处理",
  confirmed: "已确认",
  cancelled: "已取消",
};

export function OrderTable({ orders }: { orders: Order[] }) {
  return (
    <Table aria-label="订单列表" className={styles.table}>
      <TableHeader>
        <Column isRowHeader>订单号</Column>
        <Column>创建时间</Column>
        <Column>金额</Column>
        <Column>状态</Column>
        <Column>操作</Column>
      </TableHeader>
      <TableBody>
        {orders.map((order) => (
          <Row id={order.id} key={order.id}>
            <Cell>{order.number}</Cell>
            <Cell>{new Date(order.createdAt).toLocaleString("zh-CN")}</Cell>
            <Cell>¥{(order.amount / 100).toFixed(2)}</Cell>
            <Cell>{statusLabels[order.status]}</Cell>
            <Cell>
              <Link to={order.id}>查看详情</Link>
            </Cell>
          </Row>
        ))}
      </TableBody>
    </Table>
  );
}
