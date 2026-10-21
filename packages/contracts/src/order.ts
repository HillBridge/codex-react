// 订单的接口契约：实体、列表响应、状态变更请求。
import { z } from "zod";
import { paginatedSchema } from "./common";

export const orderStatusSchema = z.enum(["pending", "confirmed", "cancelled"]);

export const orderSchema = z.object({
  id: z.string(),
  merchantId: z.string(),
  number: z.string(),
  createdAt: z.string(),
  // 金额以分为单位。
  amount: z.number().int(),
  status: orderStatusSchema,
  // 乐观锁版本号：状态变更时带上，冲突返回 409。
  version: z.number().int(),
});

export const orderListResponseSchema = paginatedSchema(orderSchema);

// 订单只能从待处理变更为已确认或已取消。
export const updateOrderStatusInputSchema = z.object({
  status: z.enum(["confirmed", "cancelled"]),
  expectedVersion: z.number().int(),
});

export type OrderStatus = z.infer<typeof orderStatusSchema>;
export type Order = z.infer<typeof orderSchema>;
export type OrderListResponse = z.infer<typeof orderListResponseSchema>;
export type UpdateOrderStatusInput = z.infer<typeof updateOrderStatusInputSchema>;
