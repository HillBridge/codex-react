export type OrderStatus = "pending" | "confirmed" | "cancelled";

export interface Order {
  id: string;
  merchantId: string;
  number: string;
  createdAt: string;
  amount: number;
  status: OrderStatus;
  version: number;
}
