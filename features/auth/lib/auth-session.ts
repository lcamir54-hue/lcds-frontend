import { getCurrentUser, loginRequest, logoutRequest } from "@/lib/api/auth";
import { setUnauthorizedHandler } from "@/lib/api/client";
import { ApiError } from "@/lib/api/errors";
import type { UserPublic } from "@/lib/api/types";
import {
  AUTH_COOKIE_NAME,
  AUTH_TOKEN_STORAGE_KEY,
  AUTH_USER_STORAGE_KEY,
  type AuthUser,
  type UserRole,
} from "@/lib/constants";

const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 7;

export type LoginInput = {
  username: string;
  password: string;
};

function cookieOptions() {
  const secure =
    typeof window !== "undefined" && window.location.protocol === "https:"
      ? "; Secure"
      : "";
  return `Path=/; Max-Age=${SESSION_MAX_AGE_SECONDS}; SameSite=Lax${secure}`;
}

function notifyAuthChange() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event("lcds-auth-change"));
}

function toAuthUser(user: UserPublic): AuthUser {
  return {
    id: user.id,
    username: user.username,
    fullName: user.fullName,
    email: user.email ?? "",
    role: user.role,
  };
}

function writeCookie(role: UserRole) {
  if (typeof document === "undefined") return;
  document.cookie = `${AUTH_COOKIE_NAME}=${role}; ${cookieOptions()}`;
}

function clearCookie() {
  if (typeof document === "undefined") return;
  document.cookie = `${AUTH_COOKIE_NAME}=; Path=/; Max-Age=0; SameSite=Lax`;
}

export function getAccessToken(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(AUTH_TOKEN_STORAGE_KEY);
}

export function setSession(token: string, user: AuthUser | UserPublic) {
  if (typeof window === "undefined") return;
  const nextUser = toAuthUser(user);
  window.localStorage.setItem(AUTH_TOKEN_STORAGE_KEY, token);
  window.localStorage.setItem(AUTH_USER_STORAGE_KEY, JSON.stringify(nextUser));
  writeCookie(nextUser.role);
  cachedSessionKey = null;
  cachedSessionUser = null;
  notifyAuthChange();
}

export function clearSessionCookie() {
  clearCookie();
  if (typeof window !== "undefined") {
    window.localStorage.removeItem(AUTH_TOKEN_STORAGE_KEY);
    window.localStorage.removeItem(AUTH_USER_STORAGE_KEY);
  }
  cachedSessionKey = null;
  cachedSessionUser = null;
  notifyAuthChange();
}

function redirectToLogin() {
  if (typeof window === "undefined") return;
  if (window.location.pathname.startsWith("/login")) return;
  window.location.replace("/login");
}

function handleUnauthorized() {
  clearSessionCookie();
  redirectToLogin();
}

if (typeof window !== "undefined") {
  setUnauthorizedHandler(handleUnauthorized);
}

export function hasSessionCookie(): boolean {
  if (typeof document === "undefined") return false;
  return document.cookie
    .split(";")
    .some((part) => part.trim().startsWith(`${AUTH_COOKIE_NAME}=`));
}

export function getSessionRole(): UserRole | null {
  if (typeof document === "undefined") return null;
  const part = document.cookie
    .split(";")
    .map((item) => item.trim())
    .find((item) => item.startsWith(`${AUTH_COOKIE_NAME}=`));
  if (!part) return null;
  const value = part.slice(`${AUTH_COOKIE_NAME}=`.length);
  if (value === "admin" || value === "user") return value;
  if (value === "authenticated") return "admin";
  return null;
}

let cachedSessionKey: string | null = null;
let cachedSessionUser: AuthUser | null = null;

function readSessionCacheKey(role: UserRole): string {
  const token = window.localStorage.getItem(AUTH_TOKEN_STORAGE_KEY);
  const raw = window.localStorage.getItem(AUTH_USER_STORAGE_KEY);
  return `${role}::${token ?? ""}::${raw ?? ""}`;
}

function parseStoredUser(raw: string | null): AuthUser | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as Partial<AuthUser>;
    if (
      parsed?.id &&
      parsed.username &&
      parsed.fullName &&
      (parsed.role === "admin" || parsed.role === "user")
    ) {
      return {
        id: parsed.id,
        username: parsed.username,
        fullName: parsed.fullName,
        email: parsed.email ?? "",
        role: parsed.role,
      };
    }
  } catch {
    return null;
  }
  return null;
}

export function getSessionUser(): AuthUser | null {
  if (typeof window === "undefined") return null;
  const role = getSessionRole();
  const token = getAccessToken();
  if (!role || !token) {
    cachedSessionKey = null;
    cachedSessionUser = null;
    return null;
  }

  const cacheKey = readSessionCacheKey(role);
  if (cacheKey === cachedSessionKey) {
    return cachedSessionUser;
  }

  const nextUser = parseStoredUser(
    window.localStorage.getItem(AUTH_USER_STORAGE_KEY),
  );

  cachedSessionKey = cacheKey;
  cachedSessionUser = nextUser;
  return cachedSessionUser;
}

export function isAdmin(): boolean {
  return getSessionUser()?.role === "admin";
}

export async function login(input: LoginInput): Promise<AuthUser> {
  const response = await loginRequest(input.username, input.password);
  const user = toAuthUser(response.user);
  setSession(response.accessToken, user);
  return user;
}

export async function restoreSession(): Promise<AuthUser | null> {
  const token = getAccessToken();
  if (!token) {
    if (hasSessionCookie()) clearSessionCookie();
    return null;
  }

  try {
    const user = toAuthUser(await getCurrentUser());
    setSession(token, user);
    return user;
  } catch (error) {
    if (error instanceof ApiError && error.code === "UNAUTHORIZED") {
      clearSessionCookie();
      return null;
    }
    return getSessionUser();
  }
}

export async function logout() {
  try {
    if (getAccessToken()) {
      await logoutRequest();
    }
  } catch {
    // Client-side logout still proceeds if the server call fails.
  }
  clearSessionCookie();
}
