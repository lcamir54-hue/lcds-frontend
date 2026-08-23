"use client";

import type { Editor } from "@milkdown/kit/core";
import { Mic, Square } from "lucide-react";
import * as React from "react";

import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useLiveAsr } from "@/features/documents/hooks/use-live-asr";
import {
  captureDictationAnchor,
  type DictationAnchor,
  replaceEditorRange,
} from "@/features/documents/lib/editor-insert";
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
          className="w-[2px] rounded-full bg-interactive-foreground"
          style={{
            height: active ? `${Math.round(level * 100)}%` : "18%",
            opacity: active ? 0.55 + level * 0.45 : 0.35,
          }}
        />
      ))}
    </div>
  );
}

export function MarkdownVoiceControl({
  disabled,
  getEditor,
}: {
  disabled?: boolean;
  getEditor: () => Editor | undefined;
}) {
  const sessionRef = React.useRef<DictationAnchor | null>(null);

  const applyLiveText = React.useCallback(
    (text: string) => {
      const editor = getEditor();
      const session = sessionRef.current;
      if (!editor || !session) return;
      const live = `${session.pad}${text}`;
      session.length = replaceEditorRange(
        editor,
        session.from,
        session.length,
        live,
      );
    },
    [getEditor],
  );

  const { status, partial, levels, error, listening, start, stop } = useLiveAsr({
    onLiveText: applyLiveText,
  });

  const beginSession = React.useCallback(() => {
    const editor = getEditor();
    if (!editor) return false;
    sessionRef.current = captureDictationAnchor(editor);
    return true;
  }, [getEditor]);

  const handleToggle = React.useCallback(() => {
    if (listening) {
      stop();
      sessionRef.current = null;
      return;
    }
    if (!beginSession()) return;
    void start();
  }, [beginSession, listening, start, stop]);

  React.useEffect(() => {
    if (listening) return;
    sessionRef.current = null;
  }, [listening]);

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

  const statusLabel =
    status === "requesting"
      ? "در حال اتصال به میکروفن…"
      : partial.trim() || error || "گوش می‌دهد…";

  return listening ? (
    <div
      className="flex max-w-[min(36rem,calc(100vw-2rem))] items-center gap-2 rounded-full border border-border bg-surface/95 px-1.5 py-1 backdrop-blur-sm"
      role="status"
      aria-live="polite"
    >
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="size-8 shrink-0 rounded-full text-destructive hover:bg-interactive hover:text-destructive"
        aria-label="توقف گفتار"
        aria-pressed
        onClick={handleToggle}
      >
        <span className="relative flex size-4 items-center justify-center">
          <span className="absolute size-4 animate-ping rounded-full bg-destructive/30" />
          <Square className="relative size-3 fill-current" aria-hidden />
        </span>
      </Button>
      <VoiceWaveform levels={levels} active={status === "listening"} />
      <p className="min-w-0 flex-1 truncate pe-2 text-xs text-muted-foreground">
        <span className="me-1.5 text-[10px] font-medium tracking-wide text-destructive">
          زنده
        </span>
        {statusLabel}
      </p>
    </div>
  ) : (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          type="button"
          variant="outline"
          size="icon"
          className={cn(
            "size-9 rounded-full bg-surface/95 backdrop-blur-sm",
            status === "denied" || status === "error"
              ? "text-destructive"
              : "text-muted-foreground",
          )}
          aria-label="گفتار به نوشتار"
          aria-pressed={false}
          disabled={disabled}
          onClick={handleToggle}
        >
          <Mic className="size-4" aria-hidden />
        </Button>
      </TooltipTrigger>
      <TooltipContent>
        {error ?? "به‌جای نوشتن، صحبت کنید"}
      </TooltipContent>
    </Tooltip>
  );
}
