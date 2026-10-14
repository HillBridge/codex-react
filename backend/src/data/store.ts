import { demoUsers, initialOrders, type DemoOrder, type DemoUser } from "./demo-data";

const sessions = new Map<string, DemoUser>();
let orders: DemoOrder[] = structuredClone(initialOrders);

export function findUser(username: string, password: string) {
  return demoUsers.find(
    (user) => user.username === username && user.password === password,
  );
}

export function saveSession(id: string, user: DemoUser) {
  sessions.set(id, user);
}

export function getSession(id: string | undefined) {
  return id ? sessions.get(id) : undefined;
}

export function deleteSession(id: string | undefined) {
  if (id) sessions.delete(id);
}

export function resetDemoStore() {
  sessions.clear();
  orders = structuredClone(initialOrders);
}

export function findOrder(id: string, merchantId: string) {
  return orders.find((order) => order.id === id && order.merchantId === merchantId);
}
export function listOrders(merchantId: string) {
  return orders.filter((order) => order.merchantId === merchantId);
}
export function updateOrder(order: DemoOrder, status: DemoOrder["status"]) {
  order.status = status;
  order.version += 1;
  return order;
}
