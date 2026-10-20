// @vitest-environment node

import { createServer, request as httpRequest } from "node:http";
import type { AddressInfo } from "node:net";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { createApp } from "../app";
import { resetDemoStore } from "../data/store";

const servers: ReturnType<typeof createServer>[] = [];

beforeEach(() => resetDemoStore());
afterEach(async () => {
  await Promise.all(
    servers
      .splice(0)
      .map(
        (server) =>
          new Promise<void>((resolve, reject) =>
            server.close((error) => (error ? reject(error) : resolve())),
          ),
      ),
  );
});

async function request(
  path: string,
  init: { method?: string; headers?: object; body?: string } = {},
) {
  const server = createServer(createApp().callback());
  servers.push(server);
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  const { port } = server.address() as AddressInfo;
  return new Promise<{
    status: number;
    headers: Record<string, string | string[] | undefined>;
    json: () => unknown;
  }>((resolve, reject) => {
    const client = httpRequest(
      {
        host: "127.0.0.1",
        port,
        path,
        method: init.method,
        headers: init.headers as Record<string, string> | undefined,
      },
      (response) => {
        const chunks: Buffer[] = [];
        response.on("data", (chunk: Buffer) => chunks.push(chunk));
        response.on("end", () =>
          resolve({
            status: response.statusCode ?? 0,
            headers: response.headers,
            json: () => JSON.parse(Buffer.concat(chunks).toString()),
          }),
        );
      },
    );
    client.on("error", reject);
    if (init.body) client.write(init.body);
    client.end();
  });
}

async function login(username: string, password: string) {
  const response = await request("/api/auth/login", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ username, password }),
  });
  return String(response.headers["set-cookie"] ?? "").split(";", 1)[0];
}

describe("product routes", () => {
  it("requires a session and blocks another merchant", async () => {
    expect((await request("/api/merchants/merchant-east/products")).status).toBe(401);
    const cookie = await login("admin", "admin123");
    expect(
      (await request("/api/merchants/merchant-west/products", { headers: { cookie } }))
        .status,
    ).toBe(403);
  });

  it("filters by status and keyword with pagination", async () => {
    const cookie = await login("admin", "admin123");
    const all = await request("/api/merchants/merchant-east/products", {
      headers: { cookie },
    });
    expect(all.json()).toMatchObject({ total: 12, pageSize: 10 });

    const off = await request("/api/merchants/merchant-east/products?status=off", {
      headers: { cookie },
    });
    expect(off.json()).toMatchObject({ total: 3 });

    const search = await request("/api/merchants/merchant-east/products?q=sku-e0001", {
      headers: { cookie },
    });
    expect(search.json()).toMatchObject({ total: 1, items: [{ id: "product-1001" }] });
  });
});

describe("product creation", () => {
  const valid = { sku: "SKU-NEW1", name: "新品", price: 2500, stock: 8, status: "on" };
  const create = (
    cookie: string | undefined,
    body: unknown,
    merchant = "merchant-east",
  ) =>
    request(`/api/merchants/${merchant}/products`, {
      method: "POST",
      headers: { ...(cookie ? { cookie } : {}), "content-type": "application/json" },
      body: JSON.stringify(body),
    });

  it("requires a session, the merchant and the product:create permission", async () => {
    expect((await create(undefined, valid)).status).toBe(401);
    const admin = await login("admin", "admin123");
    expect((await create(admin, valid, "merchant-west")).status).toBe(403);
    const viewer = await login("viewer", "viewer123");
    const denied = await create(viewer, valid, "merchant-west");
    expect(denied.status).toBe(403);
    expect(denied.json()).toMatchObject({ code: "PRODUCT_CREATE_FORBIDDEN" });
  });

  it("creates a product that is listed first and counted in the overview", async () => {
    const cookie = await login("admin", "admin123");
    const created = await create(cookie, { ...valid, sku: " SKU-NEW1 ", name: " 新品 " });
    expect(created.status).toBe(201);
    expect(created.json()).toMatchObject({
      merchantId: "merchant-east",
      sku: "SKU-NEW1",
      name: "新品",
      price: 2500,
      stock: 8,
      status: "on",
    });

    const list = await request("/api/merchants/merchant-east/products", {
      headers: { cookie },
    });
    const body = list.json() as { total: number; items: { sku: string }[] };
    expect(body.total).toBe(13);
    expect(body.items[0].sku).toBe("SKU-NEW1");

    // 其他商户不受影响。
    const west = await login("viewer", "viewer123");
    const westList = await request("/api/merchants/merchant-west/products", {
      headers: { cookie: west },
    });
    expect(westList.json()).toMatchObject({ total: 1 });

    const overview = await request("/api/merchants/merchant-east/overview", {
      headers: { cookie },
    });
    const { products } = overview.json() as {
      products: { onShelf: number; offShelf: number };
    };
    expect(products.onShelf + products.offShelf).toBe(13);
  });

  it("rejects a duplicated sku case-insensitively", async () => {
    const cookie = await login("admin", "admin123");
    const response = await create(cookie, { ...valid, sku: "sku-e0001" });
    expect(response.status).toBe(409);
    expect(response.json()).toMatchObject({ code: "SKU_DUPLICATED" });
  });

  it.each([
    ["empty sku", { sku: " " }],
    ["sku with illegal characters", { sku: "A B" }],
    ["empty name", { name: "  " }],
    ["name too long", { name: "x".repeat(51) }],
    ["fractional price", { price: 10.5 }],
    ["negative price", { price: -1 }],
    ["string price", { price: "100" }],
    ["negative stock", { stock: -1 }],
    ["unknown status", { status: "draft" }],
  ])("rejects invalid input: %s", async (_name, patch) => {
    const cookie = await login("admin", "admin123");
    const response = await create(cookie, { ...valid, ...patch });
    expect(response.status).toBe(400);
    expect(response.json()).toMatchObject({ code: "VALIDATION_ERROR" });
  });
});

describe("settlement routes", () => {
  it("summarizes the amount and count from the included orders", async () => {
    const cookie = await login("admin", "admin123");
    const list = await request("/api/merchants/merchant-east/settlements", {
      headers: { cookie },
    });
    expect(list.status).toBe(200);
    const body = list.json() as { total: number; items: Record<string, unknown>[] };
    expect(body.total).toBe(3);
    expect(body.items[0]).toMatchObject({
      id: "settlement-1001",
      orderCount: 8,
      status: "paid",
    });
    expect(body.items[0].amount).toBeGreaterThan(0);
  });

  it("drops deleted orders from the settlement summary", async () => {
    const cookie = await login("admin", "admin123");
    await request("/api/merchants/merchant-east/orders/order-1001", {
      method: "DELETE",
      headers: { cookie },
    });
    const orders = await request(
      "/api/merchants/merchant-east/settlements/settlement-1001/orders",
      { headers: { cookie } },
    );
    expect((orders.json() as { items: unknown[] }).items).toHaveLength(7);
  });

  it("returns 404 for an unknown settlement", async () => {
    const cookie = await login("admin", "admin123");
    const response = await request(
      "/api/merchants/merchant-east/settlements/missing/orders",
      { headers: { cookie } },
    );
    expect(response.status).toBe(404);
  });
});

describe("overview route", () => {
  it("requires a session and blocks another merchant", async () => {
    expect((await request("/api/merchants/merchant-east/overview")).status).toBe(401);
    const cookie = await login("admin", "admin123");
    expect(
      (await request("/api/merchants/merchant-west/overview", { headers: { cookie } }))
        .status,
    ).toBe(403);
  });

  it("summarizes orders, pending settlements and products and follows order deletion", async () => {
    const cookie = await login("admin", "admin123");
    const read = async () =>
      (
        await request("/api/merchants/merchant-east/overview", { headers: { cookie } })
      ).json() as {
        orders: { total: number; pending: number; confirmed: number; cancelled: number };
        settlements: { pendingCount: number; pendingAmount: number };
        products: { onShelf: number; offShelf: number };
      };

    const before = await read();
    expect(before.orders.total).toBe(25);
    expect(
      before.orders.pending + before.orders.confirmed + before.orders.cancelled,
    ).toBe(25);
    expect(before.settlements.pendingCount).toBe(2);
    expect(before.products.onShelf + before.products.offShelf).toBe(12);

    // order-1010 属于待结算的 settlement-1002，删除后待结算金额应减少。
    await request("/api/merchants/merchant-east/orders/order-1010", {
      method: "DELETE",
      headers: { cookie },
    });
    const after = await read();
    expect(after.orders.total).toBe(24);
    expect(after.settlements.pendingAmount).toBeLessThan(
      before.settlements.pendingAmount,
    );
  });
});
