import { apiRequest } from "../../shared/api/request";
import type { Session } from "./types";

export function getSession() {
  return apiRequest<Session>("/api/session");
}

export function startDevSession(userId: string) {
  return apiRequest<Session>("/api/dev-login", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ userId }),
  });
}
