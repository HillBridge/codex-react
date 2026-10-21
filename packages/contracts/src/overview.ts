// 概览页汇总数据的接口契约。
import { z } from "zod";

const count = z.number().int().min(0);

export const overviewSchema = z.object({
  orders: z.object({
    total: count,
    pending: count,
    confirmed: count,
    cancelled: count,
    confirmedAmount: z.number().int(),
  }),
  settlements: z.object({
    pendingCount: count,
    pendingAmount: z.number().int(),
  }),
  products: z.object({
    onShelf: count,
    offShelf: count,
    lowStock: count,
  }),
});

export type Overview = z.infer<typeof overviewSchema>;
