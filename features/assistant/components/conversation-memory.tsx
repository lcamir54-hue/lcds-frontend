"use client";

import { MessageSquarePlus, Search, Trash2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import * as React from "react";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useAssistantStore } from "@/features/assistant/hooks/use-assistant-store";
import type { Conversation } from "@/features/assistant/types";
import { ASSISTANT_PATH } from "@/lib/constants";
import { cn } from "@/lib/utils";

function startOfDay(value: Date) {
  return new Date(value.getFullYear(), value.getMonth(), value.getDate()).getTime();
}

function dayLabel(iso: string) {
  const date = new Date(iso);
  const diff = Math.round(
    (startOfDay(new Date()) - startOfDay(date)) / 86_400_000,
  );
  if (diff === 0) return "امروز";
  if (diff === 1) return "دیروز";
  return new Intl.DateTimeFormat("fa-IR", {
    month: "long",
    day: "numeric",
  }).format(date);
}

function groupConversations(conversations: Conversation[]) {
  const groups: { label: string; items: Conversation[] }[] = [];
  for (const conversation of conversations) {
    const label = dayLabel(conversation.updatedAt);
    const last = groups[groups.length - 1];
    if (last && last.label === label) {
      last.items.push(conversation);
    } else {
      groups.push({ label, items: [conversation] });
    }
  }
  return groups;
}

function previewOf(conversation: Conversation) {
  const last = conversation.messages.at(-1);
  if (!last?.content) return "هنوز پیامی ثبت نشده است";
  return last.content.replace(/\s+/g, " ").slice(0, 72);
}

export function ConversationMemory() {
  const router = useRouter();
  const conversations = useAssistantStore((state) => state.conversations);
  const activeId = useAssistantStore((state) => state.activeId);
  const deleteConversation = useAssistantStore(
    (state) => state.deleteConversation,
  );
  const setMemoryOpen = useAssistantStore((state) => state.setMemoryOpen);
  const [query, setQuery] = React.useState("");
  const [pendingDelete, setPendingDelete] = React.useState<Conversation | null>(
    null,
  );

  const filtered = React.useMemo(() => {
    const needle = query.trim();
    if (!needle) return conversations;
    return conversations.filter((conversation) => {
      const haystack = [
        conversation.title,
        ...conversation.messages.map((message) => message.content),
      ].join(" ");
      return haystack.includes(needle);
    });
  }, [conversations, query]);

  const groups = groupConversations(filtered);

  return (
    <aside className="flex h-full w-[280px] shrink-0 flex-col border-e border-border bg-background">
      <div className="border-b border-border px-3 py-3">
        <p className="text-sm font-medium">حافظهٔ گفتگوها</p>
        <p className="mt-0.5 text-xs text-muted-foreground">
          دانش، مدل و پاسخ هر نوبت اینجا می‌ماند.
        </p>
      </div>

      <div className="space-y-2 px-3 py-3">
        <Button
          size="sm"
          className="w-full justify-start gap-2"
          onClick={() => {
            setMemoryOpen(false);
            router.push(ASSISTANT_PATH);
          }}
        >
          <MessageSquarePlus className="size-4" aria-hidden />
          گفتگوی تازه
        </Button>
        <div className="relative">
          <Search
            className="pointer-events-none absolute start-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground"
            aria-hidden
          />
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="جستجو در حافظه"
            className="ps-8"
            aria-label="جستجو در گفتگوها"
          />
        </div>
      </div>

      <ScrollArea className="min-h-0 flex-1 px-2 pb-3">
        {groups.length === 0 ? (
          <p className="px-2 py-6 text-center text-xs text-muted-foreground">
            هنوز گفتگویی در حافظه نیست.
          </p>
        ) : (
          groups.map((group) => (
            <div key={group.label} className="mb-3">
              <p className="px-2 pb-1 text-[11px] font-medium text-muted-foreground">
                {group.label}
              </p>
              <div className="space-y-0.5">
                {group.items.map((conversation) => {
                  const active = conversation.id === activeId;
                  return (
                    <div
                      key={conversation.id}
                      className={cn(
                        "group flex items-start gap-1 rounded-md pe-1 transition-colors duration-150 hover:bg-interactive hover:text-interactive-foreground",
                        active &&
                          "bg-interactive-selected text-interactive-foreground",
                      )}
                    >
                      <Link
                        href={`${ASSISTANT_PATH}/${conversation.id}`}
                        onClick={() => setMemoryOpen(false)}
                        className="min-w-0 flex-1 px-2 py-2"
                      >
                        <p className="truncate text-sm">{conversation.title}</p>
                        <p className="mt-0.5 line-clamp-2 text-[11px] text-muted-foreground">
                          {previewOf(conversation)}
                        </p>
                      </Link>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="mt-1 size-6 opacity-0 group-hover:opacity-100 group-focus-within:opacity-100"
                        aria-label={`حذف «${conversation.title}»`}
                        onClick={() => setPendingDelete(conversation)}
                      >
                        <Trash2 className="size-3.5" aria-hidden />
                      </Button>
                    </div>
                  );
                })}
              </div>
            </div>
          ))
        )}
      </ScrollArea>

      <AlertDialog
        open={pendingDelete !== null}
        onOpenChange={(open) => {
          if (!open) setPendingDelete(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>حذف این گفتگو از حافظه؟</AlertDialogTitle>
            <AlertDialogDescription>
              «{pendingDelete?.title}» و تمام دانش‌ها، مدل‌ها و پاسخ‌های ثبت‌شدهٔ آن
              حذف می‌شود.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>انصراف</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                if (!pendingDelete) return;
                const wasActive = pendingDelete.id === activeId;
                deleteConversation(pendingDelete.id);
                setPendingDelete(null);
                if (wasActive) router.push(ASSISTANT_PATH);
              }}
            >
              حذف
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </aside>
  );
}
