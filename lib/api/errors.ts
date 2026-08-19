export class ApiError extends Error {
  status: number;
  code: string;
  detail: string;

  constructor(input: { status: number; code: string; detail: string }) {
    super(input.detail);
    this.name = "ApiError";
    this.status = input.status;
    this.code = input.code;
    this.detail = input.detail;
  }
}

export function getErrorDetail(error: unknown, fallback = "خطای غیرمنتظره"): string {
  if (error instanceof ApiError) return error.detail;
  if (error instanceof Error && error.message) return error.message;
  return fallback;
}

export function isUnauthorized(error: unknown): boolean {
  return error instanceof ApiError && error.code === "UNAUTHORIZED";
}
