import { afterEach, describe, expect, it, vi } from "vitest";
import { apiRequest } from "./request";

afterEach(() => vi.unstubAllGlobals());

describe("apiRequest", () => {
  it("sends same-origin JSON requests and returns response data", async () => {
    const fetch = vi
      .fn()
      .mockResolvedValue(new Response('{"message":"ok"}', { status: 200 }));
    vi.stubGlobal("fetch", fetch);

    await expect(apiRequest<{ message: string }>("/api/session")).resolves.toEqual({
      message: "ok",
    });
    expect(fetch).toHaveBeenCalledWith(
      "/api/session",
      expect.objectContaining({ credentials: "same-origin" }),
    );
  });

  it("converts structured HTTP failures to ApiError", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            code: "NO_ACCESS",
            message: "无权访问",
            requestId: "req-1",
          }),
          { status: 403 },
        ),
      ),
    );
    await expect(apiRequest("/api/private")).rejects.toMatchObject({
      status: 403,
      code: "NO_ACCESS",
      requestId: "req-1",
    });
  });

  it("returns undefined for an empty 204 response", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(new Response(null, { status: 204 })),
    );
    await expect(
      apiRequest<void>("/api/auth/logout", { method: "POST" }),
    ).resolves.toBeUndefined();
  });
});
