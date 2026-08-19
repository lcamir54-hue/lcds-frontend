"use client";

import { Search } from "lucide-react";
import * as React from "react";

import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  PROCESS_LIBRARY,
  type ProcessLibraryItem,
} from "@/features/processes/lib/process-library";
import { cn } from "@/lib/utils";

type ProcessObjectLibraryProps = {
  onAdd: (item: ProcessLibraryItem) => void;
  disabled?: boolean;
};

export function ProcessObjectLibrary({
  onAdd,
  disabled,
}: ProcessObjectLibraryProps) {
  const [query, setQuery] = React.useState("");
  const [collapsed, setCollapsed] = React.useState<Record<string, boolean>>({});

  const filtered = PROCESS_LIBRARY.map((category) => ({
    ...category,
    items: category.items.filter((item) => {
      const q = query.trim();
      if (!q) return true;
      return (
        item.label.includes(q) ||
        item.description.includes(q) ||
        item.type.includes(q.toLowerCase())
      );
    }),
  })).filter((category) => category.items.length > 0);

  return (
    <aside className="flex h-full w-[260px] shrink-0 flex-col border-s border-border bg-background">
      <div className="border-b border-border px-3 py-2">
        <p className="mb-2 text-sm font-medium">کتابخانه اشیاء</p>
        <div className="relative">
          <Search className="pointer-events-none absolute start-2 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="جستجوی اشیاء…"
            className="h-8 ps-7"
            disabled={disabled}
          />
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="space-y-3 p-2">
          {filtered.map((category) => {
            const isCollapsed = collapsed[category.id];
            return (
              <div key={category.id}>
                <button
                  type="button"
                  className="mb-1 flex w-full items-center justify-between px-1 text-xs font-medium text-muted-foreground"
                  onClick={() =>
                    setCollapsed((state) => ({
                      ...state,
                      [category.id]: !state[category.id],
                    }))
                  }
                >
                  <span>{category.label}</span>
                  <span>{isCollapsed ? "+" : "−"}</span>
                </button>
                {!isCollapsed ? (
                  <div className="space-y-0.5">
                    {category.items.map((item) => (
                      <button
                        key={item.type}
                        type="button"
                        disabled={disabled}
                        title={item.description}
                        className={cn(
                          "flex w-full items-start gap-2 rounded-md px-2 py-1.5 text-start transition-colors duration-150 hover:bg-interactive hover:text-interactive-foreground disabled:opacity-50",
                        )}
                        draggable={!disabled}
                        onDragStart={(event) => {
                          event.dataTransfer.setData(
                            "application/process-object",
                            item.type,
                          );
                          event.dataTransfer.effectAllowed = "move";
                        }}
                        onPointerDown={(event) => {
                          if (disabled) return;
                          (event.currentTarget as HTMLElement).dataset.dragging =
                            "true";
                        }}
                        onClick={() => onAdd(item)}
                      >
                        <span className="text-sm" aria-hidden>
                          {item.icon}
                        </span>
                        <span className="min-w-0">
                          <span className="block truncate text-xs font-medium">
                            {item.label}
                          </span>
                          <span className="block truncate text-[10px] text-muted-foreground">
                            {item.description}
                          </span>
                        </span>
                      </button>
                    ))}
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>
      </ScrollArea>
    </aside>
  );
}
