export type Permission =
  "order:read" | "order:update" | "order:delete" | "product:create";

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
      permissions: ["order:read", "order:update", "order:delete", "product:create"],
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

export interface DemoProduct {
  id: string;
  merchantId: string;
  sku: string;
  name: string;
  price: number;
  stock: number;
  status: "on" | "off";
}

const productNames = [
  "手冲咖啡豆 227g",
  "挂耳咖啡 10 包",
  "冷萃咖啡液",
  "燕麦奶 1L",
  "陶瓷马克杯",
  "不锈钢保温杯",
  "法压壶",
  "手摇磨豆机",
  "滴滤纸 100 张",
  "咖啡豆密封罐",
  "拿铁杯碟套装",
  "礼盒装咖啡",
];

export const initialProducts: DemoProduct[] = [
  ...productNames.map((name, index): DemoProduct => ({
    id: `product-${1001 + index}`,
    merchantId: "merchant-east",
    sku: `SKU-E${String(index + 1).padStart(4, "0")}`,
    name,
    price: 1800 + index * 1350,
    stock: (index * 37) % 120,
    status: index % 4 === 3 ? "off" : "on",
  })),
  {
    id: "product-2001",
    merchantId: "merchant-west",
    sku: "SKU-W0001",
    name: "有机棉布袋",
    price: 2900,
    stock: 64,
    status: "on",
  },
];

export interface DemoSettlement {
  id: string;
  merchantId: string;
  number: string;
  periodStart: string;
  periodEnd: string;
  status: "pending" | "paid";
  orderIds: string[];
}

const eastOrderIds = (from: number, to: number) =>
  Array.from({ length: to - from + 1 }, (_, index) => `order-${from + index}`);

export const initialSettlements: DemoSettlement[] = [
  {
    id: "settlement-1001",
    merchantId: "merchant-east",
    number: "ST202610001",
    periodStart: "2026-10-12",
    periodEnd: "2026-10-12",
    status: "paid",
    orderIds: eastOrderIds(1001, 1008),
  },
  {
    id: "settlement-1002",
    merchantId: "merchant-east",
    number: "ST202610002",
    periodStart: "2026-10-13",
    periodEnd: "2026-10-13",
    status: "pending",
    orderIds: eastOrderIds(1009, 1016),
  },
  {
    id: "settlement-1003",
    merchantId: "merchant-east",
    number: "ST202610003",
    periodStart: "2026-10-14",
    periodEnd: "2026-10-14",
    status: "pending",
    orderIds: eastOrderIds(1017, 1025),
  },
  {
    id: "settlement-2001",
    merchantId: "merchant-west",
    number: "ST202610101",
    periodStart: "2026-10-12",
    periodEnd: "2026-10-12",
    status: "pending",
    orderIds: ["order-2001"],
  },
];
