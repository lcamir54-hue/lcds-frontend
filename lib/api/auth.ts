import { api } from "@/lib/api/client";
import type { TokenResponse, UserPublic } from "@/lib/api/types";

export function loginRequest(username: string, password: string) {
  return api<TokenResponse>("/api/v1/auth/login", {
    method: "POST",
    auth: false,
    skipUnauthorizedHandler: true,
    body: JSON.stringify({ username, password }),
  });
}

export function logoutRequest() {
  return api<void>("/api/v1/auth/logout", {
    method: "POST",
    skipUnauthorizedHandler: true,
  });
}

export function getCurrentUser() {
  return api<UserPublic>("/api/v1/auth/me", {
    skipUnauthorizedHandler: true,
  });
}
