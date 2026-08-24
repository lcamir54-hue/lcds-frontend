"use client";

import { Mic, Square } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { LiveAsrStatus } from "@/features/documents/hooks/use-live-asr";
import { cn } from "@/lib/utils";

function VoiceWaveform({
  levels,
  active,
}: {
  levels: number[];
  active: boolean;
}) {
  return (
    <div className="flex h-4 items-end gap-[3px]" aria-hidden>
      {levels.map((level, index) => (
        <span
          key={index}
          className="w-[2px] rounded-full bg-current"
          style={{
            height: active ? `${Math.round(level * 100)}%` : "18%",
            opacity: active ? 0.55 + level * 0.45 : 0.35,
          }}
        />
      ))}
    </div>
  );
}

export function ChatVoiceControl({
  disabled,
  listening,
  status,
  levels,
  error,
  partial,
  onToggle,
}: {
  disabled?: boolean;
  listening: boolean;
  status: LiveAsrStatus;
  levels: number[];
  error: string | null;
  partial: string;
  onToggle: () => void;
}) {
  const statusLabel =
    status === "requesting"
      ? "در حال اتصال به میکروفن…"
      : partial.trim() || error || "گوش می‌دهد…";

  if (listening) {
    return (
      <div
        className="flex min-w-0 items-center gap-1.5"
        role="status"
        aria-live="polite"
      >
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="size-8 shrink-0 text-destructive hover:text-destructive"
          aria-label="توقف دستیار صوتی"
          aria-pressed
          onClick={onToggle}
        >
          <span className="relative flex size-4 items-center justify-center">
            <span className="absolute size-4 animate-ping rounded-full bg-destructive/30" />
            <Square className="relative size-3 fill-current" aria-hidden />
          </span>
        </Button>
        <VoiceWaveform levels={levels} active={status === "listening"} />
        <p className="hidden max-w-40 truncate text-[11px] text-muted-foreground sm:block">
          {statusLabel}
        </p>
      </div>
    );
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          type="button"
          variant="outline"
          size="icon"
          className={cn(
            "size-8",
            status === "denied" || status === "error" || status === "unsupported"
              ? "text-destructive"
              : "text-muted-foreground",
          )}
          aria-label="دستیار صوتی"
          aria-pressed={false}
          disabled={disabled}
          onClick={onToggle}
        >
          <Mic className="size-4" aria-hidden />
        </Button>
      </TooltipTrigger>
      <TooltipContent>{error ?? "با صدا بپرسید"}</TooltipContent>
    </Tooltip>
  );
}
