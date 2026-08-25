"use client";

import * as React from "react";

import {
  formatTokenMeter,
  getPageTokenStatus,
  PAGE_MAX_TOKENS,
  PAGE_TOKEN_LIMIT_MESSAGE,
  type PageTokenStatus,
  validatePageContent,
} from "@/features/documents/lib/page-tokens";
import { cn } from "@/lib/utils";

const STATUS_CLASS: Record<PageTokenStatus, string> = {
  ok: "text-muted-foreground",
  warning: "text-amber-600 dark:text-amber-400",
  critical: "text-destructive",
  full: "text-destructive",
};

export function PageTokenMeter({
  content,
  className,
}: {
  content: string;
  className?: string;
}) {
  const validation = React.useMemo(
    () => validatePageContent(content),
    [content],
  );
  const status = getPageTokenStatus(validation.tokenCount);

  return (
    <span
      className={cn(
        "whitespace-nowrap text-xs tabular-nums",
        STATUS_CLASS[status],
        className,
      )}
      title={
        status === "full"
          ? PAGE_TOKEN_LIMIT_MESSAGE
          : `حداکثر ${PAGE_MAX_TOKENS.toLocaleString("fa-IR")} توکن`
      }
      aria-live="polite"
    >
      {formatTokenMeter(validation.tokenCount, validation.limit)}
    </span>
  );
}

export function PageTokenLimitBanner({
  content,
  className,
}: {
  content: string;
  className?: string;
}) {
  const validation = React.useMemo(
    () => validatePageContent(content),
    [content],
  );

  if (validation.allowed) return null;

  return (
    <div
      role="alert"
      className={cn(
        "border-b border-destructive/30 bg-destructive/10 px-3 py-2 text-sm leading-relaxed text-destructive md:px-5",
        className,
      )}
    >
      {PAGE_TOKEN_LIMIT_MESSAGE}
    </div>
  );
}
