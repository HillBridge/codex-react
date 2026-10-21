// @vitest-environment node

import { createServer, request as httpRequest } from "node:http";
import type { AddressInfo } from "node:net";
import {
  orderListResponseSchema,
  orderSchema,
  overviewSchema,
  productListResponseSchema,
  productSchema,
  sessionSchema,
  settlementListResponseSchema,
  settlementOrdersResponseSchema,
} from "@merchant/contracts";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { createApp } from "../app";
import { resetDemoStore } from "../data/store";

// 契约测试：真实接口的响应必须满足 packages/contracts 里的 schema，
// 后端改了字段或前端契约改了而后端没跟上，这里会先失败。

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
  init: { method?: string; headers?: Record<string, string>; body?: string } = {},
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
      { host: "127.0.0.1", port, path, method: init.method, headers: init.headers },
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

async function loginAsAdmin() {
  const response = await request("/api/auth/login", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ username: "admin", password: "admin123" }),
  });
  return {
    response,
    cookie: String(response.headers["set-cookie"] ?? "").split(";", 1)[0],
  };
}

const merchant = "/api/merchants/merchant-east";

describe("response contracts", () => {
  it("login and session responses satisfy sessionSchema", async () => {
    const { response, cookie } = await loginAsAdmin();
    expect(sessionSchema.parse(response.json())).toBeTruthy();
    const session = await request("/api/session", { headers: { cookie } });
    expect(sessionSchema.parse(session.json())).toBeTruthy();
  });

  it("order list and detail satisfy the order schemas", async () => {
    const { cookie } = await loginAsAdmin();
    const list = await request(`${merchant}/orders`, { headers: { cookie } });
    const page = orderListResponseSchema.parse(list.json());
    expect(page.items.length).toBeGreaterThan(0);

    const detail = await request(`${merchant}/orders/${page.items[0].id}`, {
      headers: { cookie },
    });
    expect(orderSchema.parse(detail.json()).id).toBe(page.items[0].id);
  });

  it("order status update responds with an order", async () => {
    const { cookie } = await loginAsAdmin();
    const pending = orderListResponseSchema.parse(
      (
        await request(`${merchant}/orders?status=pending`, { headers: { cookie } })
      ).json(),
    ).items[0];
    const updated = await request(`${merchant}/orders/${pending.id}/status`, {
      method: "PATCH",
      headers: { cookie, "content-type": "application/json" },
      body: JSON.stringify({ status: "confirmed", expectedVersion: pending.version }),
    });
    expect(orderSchema.parse(updated.json()).status).toBe("confirmed");
  });

  it("settlement list and its orders satisfy the settlement schemas", async () => {
    const { cookie } = await loginAsAdmin();
    const list = await request(`${merchant}/settlements`, { headers: { cookie } });
    const page = settlementListResponseSchema.parse(list.json());
    expect(page.items.length).toBeGreaterThan(0);

    const orders = await request(`${merchant}/settlements/${page.items[0].id}/orders`, {
      headers: { cookie },
    });
    expect(settlementOrdersResponseSchema.parse(orders.json()).items.length).toBe(
      page.items[0].orderCount,
    );
  });

  it("product list and creation satisfy the product schemas", async () => {
    const { cookie } = await loginAsAdmin();
    const list = await request(`${merchant}/products`, { headers: { cookie } });
    expect(productListResponseSchema.parse(list.json()).items.length).toBeGreaterThan(0);

    const created = await request(`${merchant}/products`, {
      method: "POST",
      headers: { cookie, "content-type": "application/json" },
      body: JSON.stringify({
        sku: "CONTRACT-1",
        name: "契约测试商品",
        price: 100,
        stock: 5,
        status: "on",
      }),
    });
    expect(created.status).toBe(201);
    expect(productSchema.parse(created.json()).sku).toBe("CONTRACT-1");
  });

  it("overview satisfies overviewSchema", async () => {
    const { cookie } = await loginAsAdmin();
    const response = await request(`${merchant}/overview`, { headers: { cookie } });
    expect(overviewSchema.parse(response.json()).orders.total).toBeGreaterThan(0);
  });
});
