import { Tiktoken } from "js-tiktoken/lite";
import cl100k_base from "js-tiktoken/ranks/cl100k_base";

/** سقف قطعی هر صفحه دانش (توکن) */
export const PAGE_MAX_TOKENS = 8000;
/** آستانه هشدار اولیه */
export const PAGE_WARNING_TOKENS = 6000;
/** نزدیک سقف — شمارنده قرمز */
export const PAGE_CRITICAL_TOKENS = 7500;

export const PAGE_TOKEN_LIMIT_MESSAGE =
  "ظرفیت این صفحه دانش تکمیل شده است. برای حفظ کیفیت پردازش و بازیابی اطلاعات، لطفاً ادامه محتوا را در صفحه دانش جدیدی ثبت کنید.";

export const TOKENIZER_NAME = "cl100k_base";

let encoder: Tiktoken | null = null;

function getEncoder(): Tiktoken {
  if (!encoder) {
    encoder = new Tiktoken(cl100k_base);
  }
  return encoder;
}

export function countTokens(text = ""): number {
  if (!text.trim()) return 0;
  return getEncoder().encode(text).length;
}

export type PageTokenStatus = "ok" | "warning" | "critical" | "full";

export type PageTokenValidation = {
  tokenCount: number;
  limit: number;
  remaining: number;
  warning: boolean;
  allowed: boolean;
  status: PageTokenStatus;
};

export function getPageTokenStatus(tokenCount: number): PageTokenStatus {
  if (tokenCount >= PAGE_MAX_TOKENS) return "full";
  if (tokenCount >= PAGE_CRITICAL_TOKENS) return "critical";
  if (tokenCount >= PAGE_WARNING_TOKENS) return "warning";
  return "ok";
}

export function validatePageContent(content: string): PageTokenValidation {
  const tokenCount = countTokens(content);
  const status = getPageTokenStatus(tokenCount);

  return {
    tokenCount,
    limit: PAGE_MAX_TOKENS,
    remaining: Math.max(PAGE_MAX_TOKENS - tokenCount, 0),
    warning: tokenCount >= PAGE_WARNING_TOKENS,
    allowed: tokenCount <= PAGE_MAX_TOKENS,
    status,
  };
}

/** آیا افزایش محتوا از سقف عبور می‌کند؟ کاهش محتوا همیشه مجاز است. */
export function isTokenIncreaseBlocked(
  previousContent: string,
  nextContent: string,
): boolean {
  const nextCount = countTokens(nextContent);
  if (nextCount <= PAGE_MAX_TOKENS) return false;
  const prevCount = countTokens(previousContent);
  return nextCount > prevCount;
}

export function formatTokenCount(value: number): string {
  return value.toLocaleString("fa-IR");
}

export function formatTokenMeter(tokenCount: number, limit = PAGE_MAX_TOKENS): string {
  return `${formatTokenCount(tokenCount)} از ${formatTokenCount(limit)} توکن`;
}
