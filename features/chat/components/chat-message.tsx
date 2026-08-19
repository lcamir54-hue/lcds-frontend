"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

import { ChatStatus } from "@/features/chat/components/chat-status";
import { ChatToolCallCard } from "@/features/chat/components/chat-tool-call";
import type { ChatMessage, ChatStatusState } from "@/features/chat/types";
import { cn } from "@/lib/utils";

export function ChatMessageBubble({ message }: { message: ChatMessage }) {
  if (message.role === "user") {
    return (
      <div className="flex justify-start">
        <div className="max-w-[90%] rounded-md bg-interactive-selected px-3 py-2 text-sm text-interactive-foreground">
          {message.content}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {message.steps.map((state: ChatStatusState) => (
        <div key={state} className="opacity-70">
          <ChatStatus state={state} active={false} />
        </div>
      ))}
      {message.status && !message.steps.includes(message.status) ? (
        <ChatStatus state={message.status} />
      ) : null}
      {message.tools.length > 0 ? (
        <div className="space-y-1.5">
          {message.tools.map((tool) => (
            <ChatToolCallCard key={tool.id} tool={tool} />
          ))}
        </div>
      ) : null}
      {message.content ? (
        <div
          className={cn(
            "rounded-md border border-border bg-background px-3 py-2 text-sm leading-7",
            message.isStreaming && "border-dashed",
          )}
        >
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={{
              p: ({ children }) => <p className="my-2 first:mt-0 last:mb-0">{children}</p>,
              ul: ({ children }) => <ul className="my-2 list-disc ps-4">{children}</ul>,
              ol: ({ children }) => <ol className="my-2 list-decimal ps-4">{children}</ol>,
              code: ({ children }) => (
                <code className="rounded-sm bg-muted px-1 py-0.5 font-mono text-[12px]" dir="ltr">
                  {children}
                </code>
              ),
            }}
          >
            {message.content}
          </ReactMarkdown>
          {message.isStreaming ? (
            <span className="ms-0.5 inline-block h-4 w-1 animate-pulse bg-foreground align-middle" />
          ) : null}
        </div>
      ) : message.isStreaming && !message.status && message.tools.length === 0 ? (
        <ChatStatus state="thinking" />
      ) : null}
      {message.error ? (
        <p className="text-xs text-destructive" role="alert">
          {message.error}
        </p>
      ) : null}
    </div>
  );
}
