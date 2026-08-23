"use client";

import type { Editor } from "@milkdown/kit/core";
import {
  FileText,
  Languages,
  ListChecks,
  Minimize2,
  Sparkles,
  Table2,
  WandSparkles,
} from "lucide-react";
import * as React from "react";

import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  captureEditorSelection,
  replaceEditorRange,
} from "@/features/documents/lib/editor-insert";
import { cn } from "@/lib/utils";

type WritingTask = {
  id: string;
  label: string;
  icon: React.ElementType;
};

type WritingGroup = {
  id: string;
  label: string;
  tasks: WritingTask[];
};

const WRITING_GROUPS: WritingGroup[] = [
  {
    id: "rewrite",
    label: "بازنویسی",
    tasks: [
      { id: "improve", label: "بهبود نوشتار", icon: WandSparkles },
      { id: "proofread", label: "اصلاح املا و دستور", icon: FileText },
      { id: "shorter", label: "کوتاه‌تر", icon: Minimize2 },
    ],
  },
  {
    id: "extract",
    label: "استخراج",
    tasks: [
      { id: "summarize", label: "خلاصه", icon: FileText },
      { id: "takeaways", label: "نکات کلیدی", icon: ListChecks },
      { id: "actions", label: "موارد اقدام", icon: ListChecks },
      { id: "table", label: "تبدیل به جدول", icon: Table2 },
    ],
  },
  {
    id: "tone",
    label: "لحن و زبان",
    tasks: [
      { id: "formal", label: "رسمی‌تر", icon: WandSparkles },
      { id: "simple", label: "ساده‌تر", icon: WandSparkles },
      { id: "translate", label: "ترجمه", icon: Languages },
    ],
  },
];

type SelectionChip = {
  text: string;
  top: number;
  left: number;
  from: number;
  length: number;
};

function readVisualSelection(): Omit<SelectionChip, "from" | "length"> | null {
  const selection = window.getSelection();
  if (!selection || selection.isCollapsed || selection.rangeCount === 0) {
    return null;
  }

  const range = selection.getRangeAt(0);
  const root =
    range.commonAncestorContainer instanceof Element
      ? range.commonAncestorContainer
      : range.commonAncestorContainer.parentElement;
  if (!root?.closest(".milkdown-host .ProseMirror")) return null;
  if (root.closest(".milkdown-slash-menu, .milkdown-toolbar")) return null;

  const text = selection.toString().replace(/\s+/g, " ").trim();
  if (text.length < 2) return null;

  const rect = range.getBoundingClientRect();
  if (rect.width === 0 && rect.height === 0) return null;

  return {
    text,
    top: rect.bottom + 8,
    left: Math.min(rect.left, window.innerWidth - 140),
  };
}

function buildTestDraft(task: WritingTask, source: string): string {
  return `متن آزمایشی — ${task.label}\n\n${source}\n\nاین یک پیش‌نویس نمونه است و جای متن انتخاب‌شده نوشته شد.`;
}

function wait(ms: number) {
  return new Promise((resolve) => {
    window.setTimeout(resolve, ms);
  });
}

export function MarkdownWritingAssist({
  disabled,
  getEditor,
}: {
  disabled?: boolean;
  getEditor?: () => Editor | undefined;
}) {
  const [chip, setChip] = React.useState<SelectionChip | null>(null);
  const [menuOpen, setMenuOpen] = React.useState(false);
  const [task, setTask] = React.useState<WritingTask | null>(null);
  const [running, setRunning] = React.useState(false);
  const runIdRef = React.useRef(0);

  React.useEffect(() => {
    const update = () => {
      if (menuOpen || running) return;
      const visual = readVisualSelection();
      if (!visual) {
        setChip(null);
        return;
      }
      const editor = getEditor?.();
      const range = editor
        ? captureEditorSelection(editor)
        : { from: 0, length: 0 };
      setChip({ ...visual, ...range });
    };

    document.addEventListener("selectionchange", update);
    document.addEventListener("scroll", update, true);
    window.addEventListener("resize", update);
    update();

    return () => {
      document.removeEventListener("selectionchange", update);
      document.removeEventListener("scroll", update, true);
      window.removeEventListener("resize", update);
    };
  }, [getEditor, menuOpen, running]);

  const handleMenuOpenChange = React.useCallback((open: boolean) => {
    if (running) return;
    setMenuOpen(open);
    if (open) return;
    setTask(null);
  }, [running]);

  const handleSelectTask = React.useCallback((nextTask: WritingTask) => {
    setTask(nextTask);
  }, []);

  const handleWrite = React.useCallback(async () => {
    const editor = getEditor?.();
    if (!editor || !task || !chip || running) return;

    const token = ++runIdRef.current;
    setRunning(true);

    const draft = buildTestDraft(task, chip.text);
    let length = chip.length;
    const from = chip.from;

    for (let index = 1; index <= draft.length; index += 1) {
      if (runIdRef.current !== token) return;
      length = replaceEditorRange(editor, from, length, draft.slice(0, index));
      await wait(12);
    }

    if (runIdRef.current !== token) return;
    setRunning(false);
    setMenuOpen(false);
    setTask(null);
    setChip(null);
  }, [chip, getEditor, running, task]);

  React.useEffect(() => {
    return () => {
      runIdRef.current += 1;
    };
  }, []);

  if (disabled) return null;

  return chip || menuOpen ? (
    <Popover open={menuOpen} onOpenChange={handleMenuOpenChange}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="fixed z-30 h-7 gap-1.5 rounded-md bg-surface/95 px-2 text-xs text-muted-foreground backdrop-blur-sm"
          style={{
            top: chip?.top ?? 0,
            left: chip?.left ?? 0,
          }}
          aria-label="کمک به نوشتار برای متن انتخاب‌شده"
          onMouseDown={(event) => {
            event.preventDefault();
          }}
        >
          <Sparkles className="size-3.5" aria-hidden />
          نوشتار
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        side="bottom"
        sideOffset={6}
        className="w-56 p-1"
        onOpenAutoFocus={(event) => {
          event.preventDefault();
        }}
      >
        <div className="flex flex-col py-1">
          {WRITING_GROUPS.map((group, index) => (
            <div key={group.id}>
              {index > 0 ? <div className="mx-1 my-1 h-px bg-border" /> : null}
              <p className="px-2 py-1.5 text-xs text-muted-foreground">
                {group.label}
              </p>
              {group.tasks.map((item) => {
                const Icon = item.icon;
                const active = task?.id === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    className={cn(
                      "relative flex w-full cursor-default items-center gap-2 rounded-sm px-2 py-1.5 text-start text-sm outline-none transition-colors duration-150",
                      active
                        ? "bg-interactive-selected text-interactive-foreground"
                        : "hover:bg-interactive hover:text-interactive-foreground",
                    )}
                    aria-pressed={active}
                    onMouseDown={(event) => {
                      event.preventDefault();
                    }}
                    onClick={() => handleSelectTask(item)}
                  >
                    <Icon className="size-4 shrink-0" aria-hidden />
                    <span className="min-w-0 flex-1 truncate">{item.label}</span>
                  </button>
                );
              })}
            </div>
          ))}
        </div>
        {task ? (
          <div className="border-t border-border p-1">
            <Button
              type="button"
              variant="default"
              size="sm"
              className="w-full"
              isLoading={running}
              onClick={() => {
                void handleWrite();
              }}
            >
              {running ? null : <Sparkles className="size-4" aria-hidden />}
              نوشتن
            </Button>
          </div>
        ) : null}
      </PopoverContent>
    </Popover>
  ) : null;
}
