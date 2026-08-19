"use client";

import { Check, ChevronDown, Loader2 } from "lucide-react";
import * as React from "react";

import type { ChatToolCall } from "@/features/chat/types";
import { cn } from "@/lib/utils";

const TOOL_LABELS: Record<string, string> = {
  search_knowledge: "جستجوی دانش",
  read_page: "خواندن صفحه",
  read_topic: "خواندن موضوع",
  read_process: "خواندن فرآیند",
};

export function ChatToolCallCard({ tool }: { tool: ChatToolCall }) {
  const [open, setOpen] = React.useState(true);
  const label = TOOL_LABELS[tool.name] ?? tool.name;

  return (
    <div className="rounded-md border border-border bg-surface text-xs">
      <button
        type="button"
        className="flex w-full items-center gap-2 px-2 py-1.5 text-start"
        onClick={() => setOpen((value) => !value)}
      >
        {tool.phase === "running" ? (
          <Loader2 className="size-3.5 shrink-0 animate-spin text-muted-foreground" />
        ) : (
          <Check className="size-3.5 shrink-0 text-success-muted-foreground" />
        )}
        <span className="min-w-0 flex-1 truncate font-medium">{label}</span>
        <span className="text-muted-foreground">
          {tool.phase === "running" ? "در حال اجرا" : "انجام شد"}
        </span>
        <ChevronDown
          className={cn("size-3.5 text-muted-foreground transition-transform", open && "rotate-180")}
        />
      </button>
      {open ? (
        <div className="space-y-2 border-t border-border px-2 py-2 font-mono text-[11px] leading-relaxed" dir="ltr">
          {tool.args ? (
            <pre className="overflow-x-auto whitespace-pre-wrap text-muted-foreground">
              {JSON.stringify(tool.args, null, 2)}
            </pre>
          ) : null}
          {tool.result ? (
            <pre className="max-h-40 overflow-auto whitespace-pre-wrap text-foreground">
              {tool.result}
            </pre>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
