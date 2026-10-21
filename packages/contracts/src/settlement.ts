// 结算单的接口契约：汇总实体、列表响应、结算单内的订单。
import { z } from "zod";
import { paginatedSchema } from "./common";
import { orderSchema } from "./order";

export const settlementStatusSchema = z.enum(["pending", "paid"]);

export const settlementSchema = z.object({
  id: z.string(),
  number: z.string(),
  periodStart: z.string(),
  periodEnd: z.string(),
  status: settlementStatusSchema,
  orderCount: z.number().int().min(0),
  // 金额以分为单位，由结算单包含的订单汇总得出。
  amount: z.number().int(),
});

export const settlementListResponseSchema = paginatedSchema(settlementSchema);

export const settlementOrdersResponseSchema = z.object({
  items: z.array(orderSchema),
});

export type SettlementStatus = z.infer<typeof settlementStatusSchema>;
export type Settlement = z.infer<typeof settlementSchema>;
export type SettlementListResponse = z.infer<typeof settlementListResponseSchema>;
export type SettlementOrdersResponse = z.infer<typeof settlementOrdersResponseSchema>;
