export type Permission = "order:read" | "order:update" | "order:delete";

export interface DemoMerchant {
  id: string;
  name: string;
  permissions: Permission[];
}

export interface DemoUser {
  id: string;
  username: string;
  password: string;
  name: string;
  merchant: DemoMerchant;
}

export const demoUsers: DemoUser[] = [
  {
    id: "user-admin",
    username: "admin",
    password: "admin123",
    name: "运营管理员",
    merchant: {
      id: "merchant-east",
      name: "东区旗舰店",
      permissions: ["order:read", "order:update", "order:delete"],
    },
  },
  {
    id: "user-viewer",
    username: "viewer",
    password: "viewer123",
    name: "订单查看员",
    merchant: {
      id: "merchant-west",
      name: "西区生活馆",
      permissions: ["order:read"],
    },
  },
];

export interface DemoOrder {
  id: string;
  merchantId: string;
  number: string;
  createdAt: string;
  amount: number;
  status: "pending" | "confirmed" | "cancelled";
  version: number;
}
const baseOrders: DemoOrder[] = [
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

const generatedStatuses: DemoOrder["status"][] = ["pending", "confirmed", "cancelled"];

// 东区补足到 25 条，用于演示分页（默认每页 20 条）。
const generatedEastOrders: DemoOrder[] = Array.from({ length: 23 }, (_, index) => {
  const sequence = index + 3;
  return {
    id: `order-${1000 + sequence}`,
    merchantId: "merchant-east",
    number: `OD202610130${String(sequence).padStart(3, "0")}`,
    createdAt: new Date(Date.UTC(2026, 9, 13, 8, 0) + index * 30 * 60_000).toISOString(),
    amount: 3000 + sequence * 450,
    status: generatedStatuses[index % generatedStatuses.length],
    version: 1,
  };
});

export const initialOrders: DemoOrder[] = [...baseOrders, ...generatedEastOrders];
