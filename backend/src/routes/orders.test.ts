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

async function request(path: string, init: RequestInit = {}) {
  const server = createServer(createApp().callback());
  servers.push(server);
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  const { port } = server.address() as AddressInfo;
  return new Promise<{
    status: number;
    headers: Record<string, string | string[] | undefined>;
    json: () => Promise<unknown>;
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
            json: async () => JSON.parse(Buffer.concat(chunks).toString()),
          }),
        );
      },
    );
    client.on("error", reject);
    if (init.body) client.write(init.body as string);
    client.end();
  });
}

async function login(username: string, password: string) {
  const response = await request("/api/auth/login", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ username, password }),
  });
  expect(response.status).toBe(200);
  return String(response.headers["set-cookie"] ?? "").split(";", 1)[0];
}

describe("order routes", () => {
  it("requires a session and prevents access to another merchant", async () => {
    expect((await request("/api/merchants/merchant-east/orders")).status).toBe(401);
    const cookie = await login("admin", "admin123");
    expect(
      (await request("/api/merchants/merchant-west/orders", { headers: { cookie } }))
        .status,
    ).toBe(403);
    expect(
      (
        await request("/api/merchants/merchant-east/orders/missing", {
          headers: { cookie },
        })
      ).status,
    ).toBe(404);
  });

  it("filters a merchant order list and enforces updates with versioning", async () => {
    const admin = await login("admin", "admin123");
    const list = await request(
      "/api/merchants/merchant-east/orders?status=pending&q=120001&page=1&pageSize=1",
      { headers: { cookie: admin } },
    );
    expect(list.status).toBe(200);
    await expect(list.json()).resolves.toMatchObject({
      total: 1,
      items: [{ id: "order-1001", status: "pending" }],
    });

    const conflict = await request(
      "/api/merchants/merchant-east/orders/order-1001/status",
      {
        method: "PATCH",
        headers: { cookie: admin, "content-type": "application/json" },
        body: JSON.stringify({ status: "confirmed", expectedVersion: 2 }),
      },
    );
    expect(conflict.status).toBe(409);

    const updated = await request(
      "/api/merchants/merchant-east/orders/order-1001/status",
      {
        method: "PATCH",
        headers: { cookie: admin, "content-type": "application/json" },
        body: JSON.stringify({ status: "confirmed", expectedVersion: 1 }),
      },
    );
    expect(updated.status).toBe(200);
    await expect(updated.json()).resolves.toMatchObject({
      status: "confirmed",
      version: 2,
    });
  });

  it("normalizes unsupported filters and out-of-range pagination", async () => {
    const admin = await login("admin", "admin123");
    const response = await request(
      "/api/merchants/merchant-east/orders?status=unknown&page=-3&pageSize=1000",
      { headers: { cookie: admin } },
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({ page: 1, pageSize: 100 });

    const minimumPageSize = await request(
      "/api/merchants/merchant-east/orders?pageSize=0",
      { headers: { cookie: admin } },
    );
    await expect(minimumPageSize.json()).resolves.toMatchObject({ pageSize: 1 });
  });

  it("rejects order updates from a read-only user", async () => {
    const viewer = await login("viewer", "viewer123");
    const response = await request(
      "/api/merchants/merchant-west/orders/order-2001/status",
      {
        method: "PATCH",
        headers: { cookie: viewer, "content-type": "application/json" },
        body: JSON.stringify({ status: "confirmed", expectedVersion: 1 }),
      },
    );
    expect(response.status).toBe(403);
    const order = await request("/api/merchants/merchant-west/orders/order-2001", {
      headers: { cookie: viewer },
    });
    await expect(order.json()).resolves.toMatchObject({ status: "pending", version: 1 });
  });

  it("returns 25 east orders across pages and deletes with permission", async () => {
    const admin = await login("admin", "admin123");
    const list = await request("/api/merchants/merchant-east/orders?page=2", {
      headers: { cookie: admin },
    });
    await expect(list.json()).resolves.toMatchObject({ total: 25, pageSize: 20 });

    const removed = await request("/api/merchants/merchant-east/orders/order-1002", {
      method: "DELETE",
      headers: { cookie: admin },
    });
    expect(removed.status).toBe(204);
    expect(
      (
        await request("/api/merchants/merchant-east/orders/order-1002", {
          headers: { cookie: admin },
        })
      ).status,
    ).toBe(404);
  });

  it("rejects order deletion from a read-only user", async () => {
    const viewer = await login("viewer", "viewer123");
    const response = await request("/api/merchants/merchant-west/orders/order-2001", {
      method: "DELETE",
      headers: { cookie: viewer },
    });
    expect(response.status).toBe(403);
  });
});
