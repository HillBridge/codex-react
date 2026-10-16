import axios, { AxiosError } from "axios";
import { describe, expect, it } from "vitest";
import { mockHttp } from "../../test/mockHttp";
import { apiRequest } from "./request";
import { onSessionExpired } from "./sessionExpiry";

describe("apiRequest", () => {
  it("returns response data and tags the request with an id", async () => {
    const adapter = mockHttp({ data: { message: "ok" } });

    await expect(
      apiRequest<{ message: string }>({ url: "/api/session" }),
    ).resolves.toEqual({
      message: "ok",
    });
    const config = adapter.mock.calls[0][0];
    expect(config.url).toBe("/api/session");
    expect(config.headers.get("x-request-id")).toEqual(expect.any(String));
  });

  it("converts structured HTTP failures to ApiError", async () => {
    mockHttp({
      status: 403,
      data: { code: "NO_ACCESS", message: "无权访问", requestId: "req-1" },
    });

    await expect(apiRequest({ url: "/api/private" })).rejects.toMatchObject({
      name: "ApiError",
      status: 403,
      code: "NO_ACCESS",
      requestId: "req-1",
    });
  });

  it("falls back to generic fields for non-JSON failures", async () => {
    mockHttp({ status: 502, data: "Bad Gateway" });

    await expect(apiRequest({ url: "/api/session" })).rejects.toMatchObject({
      status: 502,
      code: "HTTP_502",
      message: "请求失败，请稍后重试。",
    });
  });

  it("announces session expiry on 401", async () => {
    mockHttp({ status: 401, data: { code: "UNAUTHENTICATED", message: "请先登录。" } });
    let expired = 0;
    const onExpired = () => (expired += 1);
    const unsubscribe = onSessionExpired(onExpired);

    await expect(apiRequest({ url: "/api/session" })).rejects.toMatchObject({
      status: 401,
    });
    unsubscribe();

    expect(expired).toBe(1);
  });

  it("returns undefined for an empty 204 response", async () => {
    mockHttp({ status: 204 });

    await expect(
      apiRequest<void>({ url: "/api/auth/logout", method: "POST" }),
    ).resolves.toBeUndefined();
  });

  it("rejects a successful response that is not JSON", async () => {
    mockHttp({ data: "<html>oops</html>" });

    await expect(apiRequest({ url: "/api/session" })).rejects.toMatchObject({
      code: "INVALID_RESPONSE",
    });
  });

  it("maps network failures and timeouts", async () => {
    mockHttp(new AxiosError("Network Error", AxiosError.ERR_NETWORK));
    await expect(apiRequest({ url: "/api/session" })).rejects.toMatchObject({
      status: 0,
      code: "NETWORK_ERROR",
    });

    mockHttp(new AxiosError("timeout", AxiosError.ECONNABORTED));
    await expect(apiRequest({ url: "/api/session" })).rejects.toMatchObject({
      status: 0,
      code: "TIMEOUT",
    });
  });

  it("lets cancelled requests through untouched", async () => {
    mockHttp(new axios.CanceledError("canceled"));

    const error = await apiRequest({ url: "/api/session" }).catch((e: unknown) => e);

    expect(axios.isCancel(error)).toBe(true);
  });
});
