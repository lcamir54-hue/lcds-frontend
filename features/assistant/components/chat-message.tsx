"use client";

import { ArrowUpRight, Bot, Sparkles, User } from "lucide-react";
import Link from "next/link";

import { MarkdownRenderer } from "@/features/documents/components/markdown-renderer";
import type { ChatMessage, KnowledgeSource } from "@/features/assistant/types";
import { cn } from "@/lib/utils";

function kindLabel(kind: KnowledgeSource["kind"]) {
  if (kind === "topic") return "عنوان";
  if (kind === "process") return "فرآیند";
  return "صفحه";
}

function KnowledgeChip({ source }: { source: KnowledgeSource }) {
  const content = (
    <>
      <span aria-hidden>{source.icon}</span>
      <span className="min-w-0 truncate">{source.title}</span>
      <span className="text-[10px] text-muted-foreground">
        {source.topicTitle || kindLabel(source.kind)}
      </span>
      {source.href ? (
        <ArrowUpRight className="size-3 opacity-60" aria-hidden />
      ) : null}
    </>
  );

  const className =
    "inline-flex max-w-full items-center gap-1.5 rounded-md border border-border bg-background px-2 py-1 text-xs transition-colors duration-150 hover:bg-interactive hover:text-interactive-foreground";

  if (source.href) {
    return (
      <Link href={source.href} className={className} title={source.excerpt}>
        {content}
      </Link>
    );
  }

  return (
    <span className={className} title={source.excerpt}>
      {content}
    </span>
  );
}

function TraceCard({
  message,
  pending,
}: {
  message: ChatMessage;
  pending?: boolean;
}) {
  const trace = message.trace;
  if (!trace) {
    return (
      <div className="rounded-md border border-dashed border-border bg-surface px-3 py-2 text-xs text-muted-foreground">
        در حال جستجوی دانش سازمانی…
      </div>
    );
  }

  return (
    <div className="rounded-md border border-border bg-surface px-3 py-2.5">
      {trace.retrievalNote ? (
        <p className="text-[11px] text-muted-foreground">
          {trace.retrievalNote}
        </p>
      ) : null}
      {trace.suggestedKnowledge.length > 0 ? (
        <div className={cn(trace.retrievalNote && "mt-2", "flex flex-wrap gap-1.5")}>
          {trace.suggestedKnowledge.map((source) => (
            <KnowledgeChip key={`${source.kind}-${source.id}`} source={source} />
          ))}
        </div>
      ) : null}
      {pending ? (
        <p className="mt-2 text-[11px] text-muted-foreground">
          پاسخ در حال نوشته شدن است…
        </p>
      ) : null}
    </div>
  );
}

export function ChatMessageBubble({
  message,
  pending,
}: {
  message: ChatMessage;
  pending?: boolean;
}) {
  if (message.role === "user") {
    return (
      <div className="flex justify-start gap-2">
        <span className="mt-1 flex size-7 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground">
          <User className="size-3.5" aria-hidden />
        </span>
        <div className="max-w-[min(100%,42rem)] rounded-md bg-interactive-selected px-3 py-2 text-sm leading-7 text-interactive-foreground">
          {message.content}
        </div>
      </div>
    );
  }

  return (
    <div className="flex gap-2">
      <span className="mt-1 flex size-7 shrink-0 items-center justify-center rounded-md bg-interactive-selected text-interactive-foreground">
        <Bot className="size-3.5" aria-hidden />
      </span>
      <div className="min-w-0 flex-1 space-y-2">
        <TraceCard message={message} pending={pending && !message.content} />
        {message.content ? (
          <div
            className={cn(
              "rounded-md border border-border bg-background px-3 py-1",
              pending && "opacity-90",
            )}
          >
            <div className="mb-1 flex items-center gap-1.5 pt-2 text-[11px] text-muted-foreground">
              <Sparkles className="size-3" aria-hidden />
              {message.trace?.usedModel.id === "search"
                ? "نتایج جستجو"
                : "پاسخ مدل"}
            </div>
            <MarkdownRenderer
              markdown={message.content}
              className="mx-0 max-w-none px-0 py-2"
            />
          </div>
        ) : null}
      </div>
    </div>
  );
}
