import type { AxiosRequestConfig } from "axios";
import { ApiError } from "./ApiError";
import { http } from "./http";

export async function apiRequest<T>(config: AxiosRequestConfig): Promise<T> {
  const response = await http.request<T>(config);

  if (response.status === 204) {
    return undefined as T;
  }
  // 响应体不是合法 JSON 时 axios 会原样返回字符串。
  if (typeof response.data === "string") {
    throw new ApiError(response.status, "INVALID_RESPONSE", "服务返回了无法识别的数据。");
  }
  return response.data;
}
