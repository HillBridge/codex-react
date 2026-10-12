export type MockRole = "admin" | "viewer";

export interface MockOrder {
  id: string;
  merchantId: string;
  number: string;
  createdAt: string;
  amount: number;
  status: "pending" | "confirmed" | "cancelled";
  version: number;
}

export const mockUsers = {
  admin: { id: "user-admin", name: "运营管理员", role: "admin" as const },
  viewer: { id: "user-viewer", name: "订单查看员", role: "viewer" as const },
};

export const mockMerchants = [
  { id: "merchant-east", name: "东区旗舰店" },
  { id: "merchant-west", name: "西区生活馆" },
];

export const initialMockOrders: MockOrder[] = [
  {
    id: "order-1001",
    merchantId: "merchant-east",
    number: "OD202610120001",
    createdAt: "2026-10-12T08:30:00.000Z",
    amount: 12800,
    status: "pending",
    version: 1,
  },
  {
    id: "order-1002",
    merchantId: "merchant-east",
    number: "OD202610120002",
    createdAt: "2026-10-12T09:15:00.000Z",
    amount: 5680,
    status: "confirmed",
    version: 1,
  },
  {
    id: "order-2001",
    merchantId: "merchant-west",
    number: "OD202610120101",
    createdAt: "2026-10-12T10:05:00.000Z",
    amount: 9200,
    status: "pending",
    version: 1,
  },
];
