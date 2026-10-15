// @vitest-environment node

import { createServer, request as httpRequest } from "node:http";
import type { AddressInfo } from "node:net";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createApp } from "../app";
import { sessionCookieOptions, sessionTtlMs } from "../auth/session";
import { resetDemoStore } from "../data/store";

const servers: ReturnType<typeof createServer>[] = [];

beforeEach(() => resetDemoStore());

afterEach(async () => {
  vi.restoreAllMocks();
  await Promise.all(
    servers.splice(0).map(
      (server) =>
        new Promise<void>((resolve, reject) => {
          server.close((error) => (error ? reject(error) : resolve()));
        }),
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
    const request = httpRequest(
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
        response.on("end", () => {
          const text = Buffer.concat(chunks).toString();
          resolve({
            status: response.statusCode ?? 0,
            headers: response.headers,
            json: async () => JSON.parse(text),
          });
        });
      },
    );
    request.on("error", reject);
    if (init.body) request.write(init.body as string);
    request.end();
  });
}

function json(body: unknown, init: RequestInit = {}): RequestInit {
  return {
    ...init,
    headers: { "content-type": "application/json", ...init.headers },
    body: JSON.stringify(body),
  };
}

describe("authentication routes", () => {
  it("creates an HttpOnly session for valid administrator credentials", async () => {
    const response = await request(
      "/api/auth/login",
      json({ username: "admin", password: "admin123" }, { method: "POST" }),
    );

    expect(response.status).toBe(200);
    const cookie = String(response.headers["set-cookie"] ?? "");
    expect(cookie).toMatch(/^merchant_session=[^;]+/i);
    expect(cookie).toMatch(/path=\//i);
    expect(cookie).toMatch(/httponly/i);
    expect(cookie).toMatch(/samesite=lax/i);
    await expect(response.json()).resolves.toEqual({
      user: { id: "user-admin", name: "运营管理员" },
      merchant: {
        id: "merchant-east",
        name: "东区旗舰店",
        permissions: ["order:read", "order:update"],
      },
    });
  });

  it("restores the session from its cookie and invalidates it on logout", async () => {
    const login = await request(
      "/api/auth/login",
      json({ username: "admin", password: "admin123" }, { method: "POST" }),
    );
    const cookie = String(login.headers["set-cookie"] ?? "").split(";", 1)[0];
    expect(cookie).toMatch(/^merchant_session=/);

    const session = await request("/api/session", { headers: { cookie } });
    expect(session.status).toBe(200);
    await expect(session.json()).resolves.toMatchObject({
      user: { id: "user-admin" },
      merchant: { id: "merchant-east" },
    });

    const logout = await request("/api/auth/logout", {
      method: "POST",
      headers: { cookie },
    });
    expect(logout.status).toBe(204);
    expect(String(logout.headers["set-cookie"])).toContain("merchant_session=");

    const expired = await request("/api/session", { headers: { cookie } });
    expect(expired.status).toBe(401);
  });

  it("expires the session two hours after login", async () => {
    const login = await request(
      "/api/auth/login",
      json({ username: "admin", password: "admin123" }, { method: "POST" }),
    );
    const setCookie = String(login.headers["set-cookie"] ?? "");
    const cookie = setCookie.split(";", 1)[0];
    expect(sessionTtlMs).toBe(7_200_000);
    expect(setCookie).toMatch(/expires=/i);

    const loggedInAt = Date.now();
    vi.spyOn(Date, "now").mockReturnValue(loggedInAt + sessionTtlMs - 1_000);
    const stillValid = await request("/api/session", { headers: { cookie } });
    expect(stillValid.status).toBe(200);

    vi.spyOn(Date, "now").mockReturnValue(loggedInAt + sessionTtlMs + 1_000);
    const expired = await request("/api/session", { headers: { cookie } });
    expect(expired.status).toBe(401);
    await expect(expired.json()).resolves.toMatchObject({ code: "UNAUTHENTICATED" });
  });

  it("rejects incomplete and invalid credentials", async () => {
    const missing = await request("/api/auth/login", json({}, { method: "POST" }));
    expect(missing.status).toBe(400);
    await expect(missing.json()).resolves.toMatchObject({ code: "INVALID_CREDENTIALS" });

    const invalid = await request(
      "/api/auth/login",
      json({ username: "admin", password: "wrong" }, { method: "POST" }),
    );
    expect(invalid.status).toBe(401);
    await expect(invalid.json()).resolves.toMatchObject({ code: "INVALID_CREDENTIALS" });
  });

  it("marks session cookies secure in production", async () => {
    const originalEnvironment = process.env.NODE_ENV;
    process.env.NODE_ENV = "production";
    try {
      expect(sessionCookieOptions().secure).toBe(true);
    } finally {
      if (originalEnvironment === undefined) delete process.env.NODE_ENV;
      else process.env.NODE_ENV = originalEnvironment;
    }
  });
});
