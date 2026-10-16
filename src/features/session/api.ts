import { apiRequest } from "@/shared/api/request";
import type { Session } from "./types";

export function getSession() {
  return apiRequest<Session>({ url: "/api/session" });
}

export function login(credentials: { username: string; password: string }) {
  return apiRequest<Session>({
    url: "/api/auth/login",
    method: "POST",
    data: credentials,
  });
}

export function logout() {
  return apiRequest<void>({ url: "/api/auth/logout", method: "POST" });
}
