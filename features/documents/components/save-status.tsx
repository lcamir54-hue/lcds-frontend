"use client";

import type { SaveStatus } from "@/features/documents/types";
import { cn } from "@/lib/utils";

const LABELS: Record<SaveStatus, string> = {
  idle: "",
  saving: "در حال ذخیره…",
  saved: "ذخیره شد",
  error: "ذخیره انجام نشد",
  readonly: "فقط خواندنی",
};

export function SaveStatusIndicator({
  status,
  className,
}: {
  status: SaveStatus;
  className?: string;
}) {
  if (!status || status === "idle") return null;

  return (
    <span
      className={cn(
        "text-xs text-muted-foreground",
        status === "error" && "text-destructive",
        status === "saved" && "text-success-muted-foreground",
        className,
      )}
      role="status"
      aria-live="polite"
    >
      {LABELS[status]}
    </span>
  );
}
