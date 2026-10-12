import { http, HttpResponse } from "msw";
import { describe, expect, it } from "vitest";
import { server } from "../../mocks/server";
import { ApiError } from "./ApiError";
import { apiRequest } from "./request";

describe("apiRequest", () => {
  it("parses a successful JSON response", async () => {
    server.use(
      http.get("https://merchant.test/api/success", () =>
        HttpResponse.json({ message: "ok" }),
      ),
    );

    await expect(
      apiRequest<{ message: string }>("https://merchant.test/api/success"),
    ).resolves.toEqual({ message: "ok" });
  });

  it("maps HTTP errors to ApiError", async () => {
    server.use(
      http.get("https://merchant.test/api/failure", () =>
        HttpResponse.json(
          { code: "ORDER_CONFLICT", requestId: "req-test" },
          { status: 409 },
        ),
      ),
    );

    await expect(apiRequest("https://merchant.test/api/failure")).rejects.toMatchObject({
      status: 409,
      code: "ORDER_CONFLICT",
      requestId: "req-test",
    });
    await expect(apiRequest("https://merchant.test/api/failure")).rejects.toBeInstanceOf(
      ApiError,
    );
  });

  it("keeps network failures recognizable", async () => {
    server.use(http.get("https://merchant.test/api/offline", () => HttpResponse.error()));

    await expect(apiRequest("https://merchant.test/api/offline")).rejects.toMatchObject({
      status: 0,
      code: "NETWORK_ERROR",
    });
  });
});
