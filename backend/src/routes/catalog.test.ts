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
