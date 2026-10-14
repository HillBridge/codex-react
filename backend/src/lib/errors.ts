import type { Context } from "koa";

export class ApiHttpError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    message: string,
  ) {
    super(message);
    this.name = "ApiHttpError";
  }
}

export function sendApiError(
  ctx: Context,
  status: number,
  code: string,
  message: string,
) {
  ctx.status = status;
  ctx.body = {
    code,
    message,
    requestId: ctx.state.requestId as string,
  };
}
