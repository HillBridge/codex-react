import axios, { AxiosError } from "axios";
import { ApiError } from "./ApiError";
import { emitSessionExpired } from "./sessionExpiry";

interface ErrorPayload {
  code?: string;
  message?: string;
  requestId?: string;
}

export const http = axios.create({
  timeout: 10_000,
  responseType: "json",
  headers: { accept: "application/json" },
});

http.interceptors.request.use((config) => {
  if (!config.headers.has("x-request-id")) {
    config.headers.set("x-request-id", crypto.randomUUID());
  }
  return config;
});

// 把 axios 错误统一转换成 ApiError；主动取消的请求原样抛出，由调用方忽略。
http.interceptors.response.use(undefined, (error: unknown) => {
  if (axios.isCancel(error) || !axios.isAxiosError(error)) throw error;

  const { response } = error;
  if (!response) {
    if (error.code === AxiosError.ECONNABORTED || error.code === AxiosError.ETIMEDOUT) {
      throw new ApiError(0, "TIMEOUT", "请求超时，请稍后重试。", undefined, {
        cause: error,
      });
    }
    throw new ApiError(
      0,
      "NETWORK_ERROR",
      "无法连接到服务，请检查网络后重试。",
      undefined,
      { cause: error },
    );
  }

  // 通知应用层清除缓存并跳转到登录页。
  if (response.status === 401) emitSessionExpired();
  const payload: ErrorPayload =
    typeof response.data === "object" && response.data !== null ? response.data : {};
  const headerRequestId = response.headers?.["x-request-id"];
  throw new ApiError(
    response.status,
    payload.code ?? `HTTP_${response.status}`,
    payload.message ?? "请求失败，请稍后重试。",
    payload.requestId ??
      (typeof headerRequestId === "string" ? headerRequestId : undefined),
    { cause: error },
  );
});
