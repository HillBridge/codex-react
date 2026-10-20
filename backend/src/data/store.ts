import {
  demoUsers,
  initialOrders,
  initialProducts,
  initialSettlements,
  type DemoOrder,
  type DemoProduct,
  type DemoSettlement,
  type DemoUser,
} from "./demo-data";

const sessions = new Map<string, { user: DemoUser; expiresAt: number }>();
let orders: DemoOrder[] = structuredClone(initialOrders);
let products: DemoProduct[] = structuredClone(initialProducts);
let productSequence = 0;

export function findUser(username: string, password: string) {
  return demoUsers.find(
    (user) => user.username === username && user.password === password,
  );
}

export function saveSession(id: string, user: DemoUser, expiresAt: number) {
  sessions.set(id, { user, expiresAt });
}

export function getSession(id: string | undefined) {
  const session = id ? sessions.get(id) : undefined;
  if (!session) return undefined;
  if (session.expiresAt <= Date.now()) {
    sessions.delete(id!);
    return undefined;
  }
  return session.user;
}

export function deleteSession(id: string | undefined) {
  if (id) sessions.delete(id);
}

export function resetDemoStore() {
  sessions.clear();
  orders = structuredClone(initialOrders);
  products = structuredClone(initialProducts);
  productSequence = 0;
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
export function deleteOrder(order: DemoOrder) {
  orders = orders.filter((item) => item !== order);
}

export function listProducts(merchantId: string) {
  return products.filter((product) => product.merchantId === merchantId);
}

export function findProduct(id: string, merchantId: string) {
  return products.find(
    (product) => product.id === id && product.merchantId === merchantId,
  );
}

// SKU 在商户内不区分大小写唯一。
export function findProductBySku(merchantId: string, sku: string) {
  const target = sku.toLowerCase();
  return listProducts(merchantId).find((product) => product.sku.toLowerCase() === target);
}

export function updateProduct(
  product: DemoProduct,
  input: Omit<DemoProduct, "id" | "merchantId">,
) {
  Object.assign(product, input);
  return product;
}

// 新商品插在最前面，创建后回到第一页即可看到。
export function createProduct(
  merchantId: string,
  input: Omit<DemoProduct, "id" | "merchantId">,
) {
  productSequence += 1;
  const product: DemoProduct = {
    id: `product-${3000 + productSequence}`,
    merchantId,
    ...input,
  };
  products.unshift(product);
  return product;
}

export function listSettlements(merchantId: string) {
  return initialSettlements.filter((settlement) => settlement.merchantId === merchantId);
}

export function findSettlement(id: string, merchantId: string) {
  return initialSettlements.find(
    (settlement) => settlement.id === id && settlement.merchantId === merchantId,
  );
}

// 结算包含的订单可能已被删除，按仍存在的订单实时汇总。
export function listSettlementOrders(settlement: DemoSettlement) {
  return settlement.orderIds.flatMap((orderId) => {
    const order = findOrder(orderId, settlement.merchantId);
    return order ? [order] : [];
  });
}
