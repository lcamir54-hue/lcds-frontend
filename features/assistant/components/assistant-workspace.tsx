"use client";

import { Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";
import * as React from "react";

import { Button } from "@/components/ui/button";
import { ChatComposer } from "@/features/assistant/components/chat-composer";
import { ChatMessageBubble } from "@/features/assistant/components/chat-message";
import { ConversationMemory } from "@/features/assistant/components/conversation-memory";
import { useAssistantStore } from "@/features/assistant/hooks/use-assistant-store";
import { cancelSpeech, plainTextForSpeech, speakPersian } from "@/features/assistant/lib/speech";
import { ASSISTANT_SUGGESTED_QUESTIONS } from "@/features/assistant/lib/suggested-questions";
import { ASSISTANT_PATH } from "@/lib/constants";

export function AssistantWorkspace({
  conversationId,
}: {
  conversationId?: string;
}) {
  const router = useRouter();
  const hydrated = useAssistantStore((state) => state.hydrated);
  const conversations = useAssistantStore((state) => state.conversations);
  const activeId = useAssistantStore((state) => state.activeId);
  const sending = useAssistantStore((state) => state.sending);
  const memoryOpen = useAssistantStore((state) => state.memoryOpen);
  const setActiveId = useAssistantStore((state) => state.setActiveId);
  const setMemoryOpen = useAssistantStore((state) => state.setMemoryOpen);
  const sendMessage = useAssistantStore((state) => state.sendMessage);
  const bottomRef = React.useRef<HTMLDivElement>(null);
  const speakReplyRef = React.useRef(false);

  React.useEffect(() => {
    setActiveId(conversationId ?? null);
  }, [conversationId, setActiveId]);

  const conversation =
    conversations.find((item) => item.id === activeId) ?? null;
  const missingConversation = Boolean(
    hydrated && conversationId && !conversation,
  );

  React.useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: "end" });
  }, [conversation?.messages, sending]);

  React.useEffect(() => {
    return () => cancelSpeech();
  }, []);

  React.useEffect(() => {
    if (sending || !speakReplyRef.current) return;
    const last = conversation?.messages.at(-1);
    if (!last || last.role !== "assistant" || !last.content.trim()) return;
    speakReplyRef.current = false;
    speakPersian(plainTextForSpeech(last.content));
  }, [conversation?.messages, sending]);

  const handleSend = React.useCallback(
    (text: string, options?: { voice?: boolean }) => {
      speakReplyRef.current = Boolean(options?.voice);
      cancelSpeech();
      void (async () => {
        const id = await sendMessage(text);
        if (id && id !== conversationId) {
          router.replace(`${ASSISTANT_PATH}/${id}`);
        }
      })();
    },
    [conversationId, router, sendMessage],
  );

  return (
    <div className="relative flex min-h-0 min-w-0 flex-1 overflow-hidden">
      <div className="hidden md:flex">
        <ConversationMemory />
      </div>

      <section className="flex min-w-0 flex-1 flex-col overflow-hidden">
        {missingConversation ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-3 px-6 text-center">
            <h1 className="text-base font-medium">این گفتگو در حافظه نیست</h1>
            <p className="max-w-sm text-sm text-muted-foreground">
              ممکن است حذف شده باشد یا مربوط به حساب دیگری باشد.
            </p>
            <Button onClick={() => router.push(ASSISTANT_PATH)}>
              شروع گفتگوی تازه
            </Button>
          </div>
        ) : (
          <>
            <div className="min-h-0 flex-1 overflow-y-auto">
              {!conversation || conversation.messages.length === 0 ? (
                <EmptyChat
                  disabled={sending}
                  onSelectQuestion={handleSend}
                />
              ) : (
                <div className="mx-auto flex max-w-3xl flex-col gap-5 px-4 py-6 md:px-6">
                  {conversation.messages.map((message, index) => {
                    const isLast = index === conversation.messages.length - 1;
                    return (
                      <ChatMessageBubble
                        key={message.id}
                        message={message}
                        pending={
                          sending && isLast && message.role === "assistant"
                        }
                      />
                    );
                  })}
                  <div ref={bottomRef} />
                </div>
              )}
            </div>
            <ChatComposer onSend={handleSend} />
          </>
        )}
      </section>

      {memoryOpen ? (
        <div className="absolute inset-0 z-40 flex md:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-overlay"
            aria-label="بستن حافظه"
            onClick={() => setMemoryOpen(false)}
          />
          <div className="relative z-10 ms-auto flex h-full shadow-none">
            <ConversationMemory />
          </div>
        </div>
      ) : null}
    </div>
  );
}

function EmptyChat({
  onSelectQuestion,
  disabled = false,
}: {
  onSelectQuestion: (question: string) => void;
  disabled?: boolean;
}) {
  return (
    <div className="mx-auto flex min-h-full max-w-2xl flex-col items-center justify-center px-6 py-16 text-center">
      <span className="mb-4 flex size-12 items-center justify-center rounded-lg border border-border bg-interactive-selected text-interactive-foreground">
        <Sparkles className="size-5" aria-hidden />
      </span>
      <h1 className="text-xl font-semibold tracking-tight">
        دستیار دانش سازمانی
      </h1>
      <p className="mt-2 max-w-md text-sm leading-relaxed text-muted-foreground">
        این دستیار برای پاسخ به سوالات پرسنل ساخته شده است
      </p>
      <div className="mt-8 flex w-full max-w-lg flex-col gap-2">
        {ASSISTANT_SUGGESTED_QUESTIONS.map((question) => (
          <Button
            key={question}
            type="button"
            variant="outline"
            className="h-auto whitespace-normal px-4 py-3 text-start leading-relaxed"
            disabled={disabled}
            onClick={() => onSelectQuestion(question)}
          >
            {question}
          </Button>
        ))}
      </div>
    </div>
  );
}
