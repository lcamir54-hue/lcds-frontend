"use client";

import { Send, Square, X } from "lucide-react";
import * as React from "react";

import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import { ChatMessageBubble } from "@/features/chat/components/chat-message";
import { useChatStore } from "@/features/chat/hooks/use-chat-store";

export function ChatPanel() {
  const messages = useChatStore((s) => s.messages);
  const isStreaming = useChatStore((s) => s.isStreaming);
  const send = useChatStore((s) => s.send);
  const stop = useChatStore((s) => s.stop);
  const setOpen = useChatStore((s) => s.setOpen);
  const [draft, setDraft] = React.useState("");
  const bottomRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages]);

  const submit = () => {
    const value = draft;
    setDraft("");
    void send(value);
  };

  return (
    <aside className="flex h-full w-full max-w-[420px] shrink-0 flex-col border-s border-border bg-background md:w-[380px]">
      <div className="flex h-12 items-center justify-between border-b border-border px-3">
        <div>
          <p className="text-sm font-medium">دستیار دانش</p>
          <p className="text-[11px] text-muted-foreground">
            Thinking و Using tools به‌صورت زنده نمایش داده می‌شوند
          </p>
        </div>
        <Button
          variant="ghost"
          size="icon"
          aria-label="بستن گفتگو"
          onClick={() => setOpen(false)}
        >
          <X className="size-4" />
        </Button>
      </div>

      <ScrollArea className="min-h-0 flex-1">
        <div className="space-y-4 px-3 py-3">
          {messages.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              درباره موضوع‌ها، صفحات و فرآیندها بپرسید. پاسخ به‌تدریج و همراه با وضعیت
              ابزارها نمایش داده می‌شود.
            </p>
          ) : (
            messages.map((message) => (
              <ChatMessageBubble key={message.id} message={message} />
            ))
          )}
          <div ref={bottomRef} />
        </div>
      </ScrollArea>

      <form
        className="border-t border-border p-3"
        onSubmit={(event) => {
          event.preventDefault();
          if (isStreaming) {
            stop();
            return;
          }
          submit();
        }}
      >
        <Textarea
          value={draft}
          rows={3}
          placeholder="سؤال خود را بنویسید…"
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter" && !event.shiftKey) {
              event.preventDefault();
              if (!isStreaming) submit();
            }
          }}
        />
        <div className="mt-2 flex justify-end">
          {isStreaming ? (
            <Button type="submit" variant="outline" size="sm">
              <Square className="size-3.5" />
              توقف
            </Button>
          ) : (
            <Button type="submit" size="sm" disabled={!draft.trim()}>
              <Send className="size-3.5" />
              ارسال
            </Button>
          )}
        </div>
      </form>
    </aside>
  );
}
