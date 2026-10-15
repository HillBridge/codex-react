import { apiRequest } from "../../shared/api/request";
import type { Session } from "./types";

export function getSession() {
  return apiRequest<Session>("/api/session");
}

export function login(credentials: { username: string; password: string }) {
  return apiRequest<Session>("/api/auth/login", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(credentials),
  });
}

export function logout() {
  return apiRequest<void>("/api/auth/logout", { method: "POST" });
}
