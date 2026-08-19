"use client";

import { Loader2, Wrench } from "lucide-react";

import type { ChatStatusState } from "@/features/chat/types";
import { cn } from "@/lib/utils";

const LABELS: Record<ChatStatusState, { title: string; hint: string }> = {
  thinking: { title: "Thinking", hint: "در حال فکر کردن" },
  using_tools: { title: "Using tools", hint: "در حال استفاده از ابزارها" },
};

export function ChatStatus({
  state,
  active = true,
}: {
  state: ChatStatusState;
  active?: boolean;
}) {
  const label = LABELS[state];
  return (
    <div
      className={cn(
        "inline-flex items-center gap-2 rounded-md border border-border bg-muted/50 px-2 py-1 text-xs text-muted-foreground",
      )}
      aria-live={active ? "polite" : "off"}
    >
      {state === "thinking" ? (
        <Loader2 className={cn("size-3.5", active && "animate-spin")} aria-hidden />
      ) : (
        <Wrench className={cn("size-3.5", active && "animate-pulse")} aria-hidden />
      )}
      <span className="font-medium text-foreground">{label.title}</span>
      <span>{label.hint}</span>
    </div>
  );
}
