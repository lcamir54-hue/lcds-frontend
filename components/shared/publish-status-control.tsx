"use client";

import {
  PUBLISH_STATUS_LABELS,
  type PublishStatus,
} from "@/features/documents/types";
import { cn } from "@/lib/utils";

type PublishStatusControlProps = {
  value: PublishStatus;
  onChange: (status: PublishStatus) => void;
  disabled?: boolean;
  className?: string;
};

const OPTIONS: PublishStatus[] = ["draft", "published"];

export function PublishStatusControl({
  value,
  onChange,
  disabled,
  className,
}: PublishStatusControlProps) {
  return (
    <div
      className={cn(
        "inline-flex rounded-md border border-border p-0.5",
        className,
      )}
      role="group"
      aria-label="وضعیت انتشار"
    >
      {OPTIONS.map((status) => (
        <button
          key={status}
          type="button"
          disabled={disabled}
          className={cn(
            "rounded-sm px-2.5 py-1 text-xs transition-colors duration-150 disabled:opacity-50",
            value === status
              ? status === "published"
                ? "bg-success text-success-foreground hover:bg-success"
                : "bg-interactive-selected text-interactive-foreground"
              : "text-muted-foreground hover:bg-interactive hover:text-interactive-foreground",
          )}
          aria-pressed={value === status}
          onClick={() => onChange(status)}
        >
          {PUBLISH_STATUS_LABELS[status]}
        </button>
      ))}
    </div>
  );
}
