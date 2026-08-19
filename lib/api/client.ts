import { apiUrl } from "@/lib/api/config";
import { ApiError } from "@/lib/api/errors";
import { AUTH_TOKEN_STORAGE_KEY } from "@/lib/constants";

type ApiOptions = RequestInit & {
  token?: string | null;
  auth?: boolean;
  skipUnauthorizedHandler?: boolean;
};

let unauthorizedHandler: (() => void) | null = null;

export function setUnauthorizedHandler(handler: (() => void) | null) {
  unauthorizedHandler = handler;
}

function readStoredToken(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(AUTH_TOKEN_STORAGE_KEY);
}

function newRequestId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export async function api<T>(path: string, options: ApiOptions = {}): Promise<T> {
  const { token, auth = true, skipUnauthorizedHandler = false, ...init } = options;
  const headers = new Headers(init.headers);
  headers.set("Accept", "application/json");
  if (!headers.has("X-Request-ID")) {
    headers.set("X-Request-ID", newRequestId());
  }

  const hasBody = init.body !== undefined && init.body !== null;
  if (hasBody && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const resolvedToken = token === undefined ? (auth ? readStoredToken() : null) : token;
  if (resolvedToken) {
    headers.set("Authorization", `Bearer ${resolvedToken}`);
  }

  const res = await fetch(apiUrl(path), {
    ...init,
    headers,
  });

  if (res.status === 204) {
    return undefined as T;
  }

  const data = await res.json().catch(() => null);

  if (!res.ok) {
    const err = new ApiError({
      status: res.status,
      detail:
        typeof data?.detail === "string" ? data.detail : "خطای غیرمنتظره",
      code: typeof data?.code === "string" ? data.code : "INTERNAL_ERROR",
    });

    if (err.code === "UNAUTHORIZED" && !skipUnauthorizedHandler) {
      unauthorizedHandler?.();
    }

    throw err;
  }

  return data as T;
}

export function queryString(
  params: Record<string, string | number | boolean | undefined | null>,
): string {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === "") continue;
    search.set(key, String(value));
  }
  const result = search.toString();
  return result ? `?${result}` : "";
}
