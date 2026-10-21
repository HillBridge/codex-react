import { AxiosError, type AxiosResponse, type InternalAxiosRequestConfig } from "axios";
import { vi } from "vitest";
import { http } from "@/shared/api/http";

const defaultAdapter = http.defaults.adapter;

export interface MockReply {
  status?: number;
  data?: unknown;
  headers?: Record<string, string>;
}

type Reply = MockReply | Error;

// 在 axios adapter 层模拟后端：保留拦截器、错误转换等真实逻辑。
export function mockHttp(reply: Reply | ((config: InternalAxiosRequestConfig) => Reply)) {
  const adapter = vi.fn(async (config: InternalAxiosRequestConfig) => {
    const result = typeof reply === "function" ? reply(config) : reply;
    if (result instanceof Error) throw result;

    const status = result.status ?? 200;
    const response: AxiosResponse = {
      data: result.data ?? "",
      status,
      statusText: "",
      headers: result.headers ?? {},
      config,
    };
    if (status >= 200 && status < 300) return response;
    throw new AxiosError(
      `Request failed with status code ${status}`,
      status >= 500 ? AxiosError.ERR_BAD_RESPONSE : AxiosError.ERR_BAD_REQUEST,
      config,
      null,
      response,
    );
  });
  http.defaults.adapter = adapter;
  return adapter;
}

export function restoreHttp() {
  http.defaults.adapter = defaultAdapter;
}
