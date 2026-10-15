import { beforeEach, describe, expect, it, vi } from "vitest";
import { ApiError } from "../shared/api/ApiError";
import { notifyError } from "../shared/ui/toast";
import { createAppQueryClient } from "./queryClient";

vi.mock("../shared/ui/toast", () => ({ notifyError: vi.fn() }));

beforeEach(() => vi.mocked(notifyError).mockClear());

function fetchQuery(
  client: ReturnType<typeof createAppQueryClient>,
  error: Error,
  meta?: Record<string, unknown>,
) {
  return client
    .fetchQuery({
      queryKey: ["probe"],
      queryFn: () => Promise.reject(error),
      retry: false,
      staleTime: 0,
      meta,
    })
    .catch(() => undefined);
}

describe("createAppQueryClient", () => {
  it("does not toast when the first load fails", async () => {
    await fetchQuery(
      createAppQueryClient(),
      new ApiError(500, "INTERNAL_ERROR", "服务异常"),
    );

    expect(notifyError).not.toHaveBeenCalled();
  });

  it("toasts when a refresh fails and old data is kept", async () => {
    const client = createAppQueryClient();
    client.setQueryData(["probe"], { ok: true });

    await fetchQuery(client, new ApiError(500, "INTERNAL_ERROR", "服务异常", "req-1"));

    expect(notifyError).toHaveBeenCalledWith({ message: "服务异常", requestId: "req-1" });
  });

  it("skips 401 and silent queries even when old data exists", async () => {
    const client = createAppQueryClient();
    client.setQueryData(["probe"], { ok: true });

    await fetchQuery(client, new ApiError(401, "UNAUTHORIZED", "未登录"));
    await fetchQuery(client, new ApiError(500, "INTERNAL_ERROR", "服务异常"), {
      silent: true,
    });

    expect(notifyError).not.toHaveBeenCalled();
  });
});
