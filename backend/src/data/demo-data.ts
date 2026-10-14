export type Permission = "order:read" | "order:update";

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
      permissions: ["order:read", "order:update"],
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
