import { formatCents } from "@/shared/lib/format";
import type { OrderStatus } from "./types";

export const orderStatusLabels: Record<OrderStatus, string> = {
  pending: "待处理",
  confirmed: "已确认",
  cancelled: "已取消",
};

export const formatOrderAmount = formatCents;

export const formatOrderTime = (createdAt: string) =>
  new Date(createdAt).toLocaleString("zh-CN");
