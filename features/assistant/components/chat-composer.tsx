"use client";

import { ArrowUp, Cloud, Cpu, Search } from "lucide-react";
import * as React from "react";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ChatVoiceControl } from "@/features/assistant/components/chat-voice-control";
import { useAssistantStore } from "@/features/assistant/hooks/use-assistant-store";
import { ASSISTANT_CHAT_PROVIDERS } from "@/features/assistant/lib/models";
import { cancelSpeech } from "@/features/assistant/lib/speech";
import { useLiveAsr } from "@/features/documents/hooks/use-live-asr";
import { cn } from "@/lib/utils";

export function ChatComposer({
  onSend,
}: {
  onSend: (text: string, options?: { voice?: boolean }) => void;
}) {
  const sending = useAssistantStore((state) => state.sending);
  const selectedProvider = useAssistantStore((state) => state.selectedProvider);
  const setSelectedProvider = useAssistantStore(
    (state) => state.setSelectedProvider,
  );
  const [value, setValue] = React.useState("");
  const textareaRef = React.useRef<HTMLTextAreaElement>(null);
  const valueRef = React.useRef(value);
  const baseRef = React.useRef("");
  const voiceUsedRef = React.useRef(false);
  valueRef.current = value;

  const applyLiveText = React.useCallback((text: string) => {
    voiceUsedRef.current = true;
    const base = baseRef.current;
    setValue([base, text].filter(Boolean).join(" "));
  }, []);

  const { status, partial, levels, error, listening, start, stop } = useLiveAsr({
    onLiveText: applyLiveText,
  });

  const resize = React.useCallback(() => {
    const node = textareaRef.current;
    if (!node) return;
    node.style.height = "auto";
    node.style.height = `${Math.min(node.scrollHeight, 180)}px`;
  }, []);

  React.useEffect(() => {
    resize();
  }, [value, resize]);

  React.useEffect(() => {
    if (sending && listening) stop();
  }, [listening, sending, stop]);

  const submit = React.useCallback(
    (fromVoice = false) => {
      if (listening) stop();
      const text = valueRef.current.trim();
      if (!text || sending) return;
      const voice = fromVoice || voiceUsedRef.current;
      voiceUsedRef.current = false;
      onSend(text, { voice });
      setValue("");
      requestAnimationFrame(() => {
        if (textareaRef.current) {
          textareaRef.current.style.height = "auto";
          textareaRef.current.focus();
        }
      });
    },
    [listening, onSend, sending, stop],
  );

  const toggleVoice = React.useCallback(() => {
    if (listening) {
      stop();
      if (valueRef.current.trim() && voiceUsedRef.current) {
        submit(true);
      }
      return;
    }
    if (sending) return;
    cancelSpeech();
    baseRef.current = valueRef.current.trim();
    void start();
  }, [listening, sending, start, stop, submit]);

  React.useEffect(() => {
    if (!listening) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      event.preventDefault();
      stop();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [listening, stop]);

  return (
    <form
      className="border-t border-border bg-background px-4 py-3 md:px-6"
      onSubmit={(event) => {
        event.preventDefault();
        submit(listening);
      }}
    >
      <div className="mx-auto max-w-3xl rounded-lg border border-border bg-surface p-2">
        <Textarea
          ref={textareaRef}
          value={value}
          rows={1}
          placeholder={
            listening
              ? "گوش می‌دهد…"
              : selectedProvider === "search"
                ? "در دانش سازمانی جستجو کنید…"
                : "از دانش سازمانی بپرسید…"
          }
          className="min-h-11 resize-none border-0 bg-transparent px-2 py-2 shadow-none focus-visible:ring-0"
          disabled={sending}
          readOnly={listening}
          onChange={(event) => setValue(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter" && !event.shiftKey) {
              event.preventDefault();
              submit(listening);
            }
          }}
        />
        <div className="flex items-center justify-between gap-2 px-1 pb-0.5">
          <div
            className="flex min-w-0 flex-wrap items-center gap-1"
            role="group"
            aria-label="انتخاب مدل یا جستجو"
          >
            {ASSISTANT_CHAT_PROVIDERS.map((provider) => {
              const selected = selectedProvider === provider.id;
              return (
                <Button
                  key={provider.id}
                  type="button"
                  size="sm"
                  variant={selected ? "default" : "outline"}
                  className={cn("gap-1.5", !selected && "bg-transparent")}
                  disabled={sending || listening}
                  aria-pressed={selected}
                  onClick={() => setSelectedProvider(provider.id)}
                >
                  {provider.id === "local" ? (
                    <Cpu className="size-3.5" aria-hidden />
                  ) : provider.id === "external" ? (
                    <Cloud className="size-3.5" aria-hidden />
                  ) : (
                    <Search className="size-3.5" aria-hidden />
                  )}
                  {provider.label}
                </Button>
              );
            })}
          </div>
          <div className="flex shrink-0 items-center gap-1">
            <ChatVoiceControl
              disabled={sending}
              listening={listening}
              status={status}
              levels={levels}
              error={error}
              partial={partial}
              onToggle={toggleVoice}
            />
            <Button
              type="submit"
              size="icon"
              className="size-8"
              disabled={sending || !value.trim()}
              aria-label="ارسال پرسش"
              isLoading={sending}
            >
              {sending ? null : <ArrowUp className="size-4" aria-hidden />}
            </Button>
          </div>
        </div>
      </div>
    </form>
  );
}
