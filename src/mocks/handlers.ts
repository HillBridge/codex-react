import { http, HttpResponse } from "msw";
import {
  initialMockOrders,
  mockMerchants,
  mockUsers,
  type MockOrder,
  type MockRole,
} from "./fixtures";

let activeUserId: string | null = null;
let orders: MockOrder[] = structuredClone(initialMockOrders);

function activeUser() {
  return Object.values(mockUsers).find((user) => user.id === activeUserId);
}

function apiError(status: number, code: string, message: string) {
  return HttpResponse.json(
    { code, message, requestId: `mock-${code.toLowerCase()}` },
    { status },
  );
}

function requireUser() {
  const user = activeUser();
  return user ?? null;
}

function permissionsFor(role: MockRole) {
  return role === "admin" ? ["order:read", "order:update"] : ["order:read"];
}

export function resetMockState() {
  activeUserId = null;
  orders = structuredClone(initialMockOrders);
}

export const handlers = [
  http.get("*/api/session", () => {
    const user = requireUser();
    return user
      ? HttpResponse.json({ user: { id: user.id, name: user.name } })
      : apiError(401, "UNAUTHENTICATED", "请先登录。");
  }),
  http.post("*/api/dev-login", async ({ request }) => {
    const body = (await request.json().catch(() => ({}))) as { userId?: string };
    const user = Object.values(mockUsers).find((item) => item.id === body.userId);
    if (!user) return apiError(400, "INVALID_DEMO_USER", "演示账号无效。");
    activeUserId = user.id;
    return HttpResponse.json({ user: { id: user.id, name: user.name } });
  }),
  http.get("*/api/merchants", () => {
    const user = requireUser();
    if (!user) return apiError(401, "UNAUTHENTICATED", "请先登录。");
    return HttpResponse.json({
      items: mockMerchants.map((merchant) => ({
        ...merchant,
        permissions: permissionsFor(user.role),
      })),
    });
  }),
  http.get("*/api/merchants/:merchantId/orders", ({ params, request }) => {
    const user = requireUser();
    if (!user) return apiError(401, "UNAUTHENTICATED", "请先登录。");
    const merchantId = String(params.merchantId);
    if (!mockMerchants.some((merchant) => merchant.id === merchantId)) {
      return apiError(403, "MERCHANT_FORBIDDEN", "无权访问该商户。");
    }

    const url = new URL(request.url);
    const status = url.searchParams.get("status");
    const query = url.searchParams.get("q")?.trim().toLowerCase() ?? "";
    const page = Math.max(1, Number(url.searchParams.get("page")) || 1);
    const pageSize = Math.min(
      100,
      Math.max(1, Number(url.searchParams.get("pageSize")) || 20),
    );
    const filtered = orders.filter((order) => {
      const matchesStatus = !status || status === "all" || order.status === status;
      const matchesQuery =
        !query || order.number.toLowerCase().includes(query) || order.id.includes(query);
      return order.merchantId === merchantId && matchesStatus && matchesQuery;
    });
    const start = (page - 1) * pageSize;
    return HttpResponse.json({
      items: filtered.slice(start, start + pageSize),
      total: filtered.length,
      page,
      pageSize,
    });
  }),
  http.get("*/api/merchants/:merchantId/orders/:orderId", ({ params }) => {
    const user = requireUser();
    if (!user) return apiError(401, "UNAUTHENTICATED", "请先登录。");
    const order = orders.find(
      (item) => item.id === params.orderId && item.merchantId === params.merchantId,
    );
    return order
      ? HttpResponse.json(order)
      : apiError(404, "ORDER_NOT_FOUND", "订单不存在。");
  }),
  http.patch(
    "*/api/merchants/:merchantId/orders/:orderId/status",
    async ({ params, request }) => {
      const user = requireUser();
      if (!user) return apiError(401, "UNAUTHENTICATED", "请先登录。");
      if (user.role !== "admin")
        return apiError(403, "ORDER_UPDATE_FORBIDDEN", "无权修改订单。");

      const order = orders.find(
        (item) => item.id === params.orderId && item.merchantId === params.merchantId,
      );
      if (!order) return apiError(404, "ORDER_NOT_FOUND", "订单不存在。");

      const body = (await request.json().catch(() => ({}))) as {
        status?: MockOrder["status"];
        expectedVersion?: number;
      };
      if (body.expectedVersion !== order.version) {
        return apiError(409, "ORDER_CONFLICT", "订单状态已变化，请刷新后重试。");
      }
      if (
        order.status !== "pending" ||
        !["confirmed", "cancelled"].includes(body.status ?? "")
      ) {
        return apiError(409, "INVALID_ORDER_TRANSITION", "当前订单状态不支持此操作。");
      }

      order.status = body.status!;
      order.version += 1;
      return HttpResponse.json(order);
    },
  ),
];
