"use client";

import * as React from "react";

import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useWorkspaceStore } from "@/features/documents/hooks/use-workspace-store";
import { extractOutline } from "@/features/documents/lib/markdown-utils";
import { cn } from "@/lib/utils";

function scrollToHeading(id: string, text: string) {
  const byId = document.getElementById(id);
  if (byId) {
    byId.scrollIntoView({ behavior: "smooth", block: "start" });
    return;
  }

  const roots = document.querySelectorAll(".ProseMirror, .markdown-body");
  for (const root of roots) {
    const headings = root.querySelectorAll("h1, h2, h3, h4, h5, h6");
    for (const heading of headings) {
      if (heading.textContent?.trim() === text.trim()) {
        heading.scrollIntoView({ behavior: "smooth", block: "start" });
        return;
      }
    }
  }
}

export function DocumentOutline() {
  const markdown = useWorkspaceStore((s) => s.markdown);
  const outlineOpen = useWorkspaceStore((s) => s.outlineOpen);
  const setOutlineOpen = useWorkspaceStore((s) => s.setOutlineOpen);
  const headings = extractOutline(markdown);
  const [activeId, setActiveId] = React.useState<string | null>(
    headings[0]?.id ?? null,
  );

  React.useEffect(() => {
    if (!outlineOpen) return;

    const nodes = headings
      .map((heading) => document.getElementById(heading.id))
      .filter((node): node is HTMLElement => Boolean(node));

    if (nodes.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (visible?.target.id) {
          setActiveId(visible.target.id);
        }
      },
      { rootMargin: "-15% 0px -65% 0px", threshold: [0, 0.25, 0.5, 1] },
    );

    nodes.forEach((node) => observer.observe(node));
    return () => observer.disconnect();
  }, [headings, outlineOpen]);

  if (!outlineOpen) return null;

  return (
    <aside
      className="flex h-full w-[260px] shrink-0 flex-col border-s border-border bg-background"
      aria-label="فهرست مطالب"
    >
      <div className="flex h-12 items-center justify-between border-b border-border px-3">
        <p className="text-sm font-medium">فهرست مطالب</p>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setOutlineOpen(false)}
        >
          بستن
        </Button>
      </div>

      <ScrollArea className="flex-1 px-2 py-2">
        {headings.length === 0 ? (
          <p className="px-2 py-4 text-xs text-muted-foreground">
            هنوز عنوانی در سند وجود ندارد.
          </p>
        ) : (
          <nav className="flex flex-col gap-0.5" aria-label="فهرست مطالب سند">
            {headings.map((heading) => (
              <button
                key={heading.id}
                type="button"
                className={cn(
                  "rounded-md px-2 py-1.5 text-start text-xs leading-5 transition-colors duration-150 hover:bg-interactive hover:text-interactive-foreground",
                  heading.level === 2 && "ps-4",
                  heading.level === 3 && "ps-6",
                  heading.level === 4 && "ps-8",
                  heading.level >= 5 && "ps-10",
                  activeId === heading.id &&
                    "bg-interactive-selected text-interactive-foreground",
                )}
                onClick={() => {
                  scrollToHeading(heading.id, heading.text);
                  setActiveId(heading.id);
                }}
              >
                {heading.text}
              </button>
            ))}
          </nav>
        )}
      </ScrollArea>
    </aside>
  );
}
