import { ApiError } from "./ApiError";

interface ErrorPayload {
  code?: string;
  message?: string;
  requestId?: string;
}

export async function apiRequest<T>(path: string, init: RequestInit = {}): Promise<T> {
  let response: Response;
  const headers = new Headers(init.headers);
  headers.set("accept", "application/json");
  headers.set("x-request-id", headers.get("x-request-id") ?? crypto.randomUUID());
  if (init.body && !headers.has("content-type")) {
    headers.set("content-type", "application/json");
  }

  try {
    response = await fetch(path, {
      ...init,
      headers,
      credentials: init.credentials ?? "same-origin",
    });
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      throw error;
    }

    throw new ApiError(
      0,
      "NETWORK_ERROR",
      "无法连接到服务，请检查网络后重试。",
      undefined,
      {
        cause: error,
      },
    );
  }

  if (!response.ok) {
    const payload = (await response.json().catch(() => ({}))) as ErrorPayload;
    if (response.status === 401 && typeof window !== "undefined") {
      window.dispatchEvent(new Event("app:session-expired"));
    }
    throw new ApiError(
      response.status,
      payload.code ?? `HTTP_${response.status}`,
      payload.message ?? "请求失败，请稍后重试。",
      payload.requestId ?? response.headers.get("x-request-id") ?? undefined,
    );
  }

  if (response.status === 204) {
    return undefined as T;
  }

  try {
    return (await response.json()) as T;
  } catch (error) {
    throw new ApiError(
      response.status,
      "INVALID_RESPONSE",
      "服务返回了无法识别的数据。",
      undefined,
      {
        cause: error,
      },
    );
  }
}
