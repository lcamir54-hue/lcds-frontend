"use client";

import { ListTree } from "lucide-react";
import * as React from "react";

import { PublishStatusControl } from "@/components/shared/publish-status-control";
import { SaveActionButton } from "@/components/shared/save-action-button";
import { Button } from "@/components/ui/button";
import { useAccessPrincipal } from "@/features/documents/hooks/use-access-principal";
import { useWorkspaceStore } from "@/features/documents/hooks/use-workspace-store";
import { canWriteDocument } from "@/features/documents/lib/access-control";
import type { PublishStatus } from "@/features/documents/types";
import { cn } from "@/lib/utils";

export function DocumentToolbar() {
  const activeMeta = useWorkspaceStore((s) => s.activeMeta);
  const viewMode = useWorkspaceStore((s) => s.viewMode);
  const isDirty = useWorkspaceStore((s) => s.isDirty);
  const isSaving = useWorkspaceStore((s) => s.isSaving);
  const saveStatus = useWorkspaceStore((s) => s.saveStatus);
  const outlineOpen = useWorkspaceStore((s) => s.outlineOpen);
  const setViewMode = useWorkspaceStore((s) => s.setViewMode);
  const setOutlineOpen = useWorkspaceStore((s) => s.setOutlineOpen);
  const updatePublishStatus = useWorkspaceStore((s) => s.updatePublishStatus);
  const saveActive = useWorkspaceStore((s) => s.saveActive);
  const principal = useAccessPrincipal();

  const canWrite = activeMeta
    ? canWriteDocument(activeMeta, principal)
    : false;

  React.useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (!(event.metaKey || event.ctrlKey) || event.key.toLowerCase() !== "s") {
        return;
      }
      if (!canWrite || !isDirty) return;
      event.preventDefault();
      void saveActive();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [canWrite, isDirty, saveActive]);

  const title = activeMeta?.title ?? "بدون عنوان";
  const icon = activeMeta?.icon ?? "📄";
  const status = (activeMeta?.status ?? "draft") as PublishStatus;

  return (
    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border px-3 py-2 md:px-5">
      <div className="flex min-w-0 items-center gap-2">
        <span className="text-base" aria-hidden>
          {icon}
        </span>
        <h1 className="truncate text-sm font-medium">{title}</h1>
        {canWrite ? (
          <SaveActionButton
            dirty={isDirty}
            saving={isSaving}
            error={saveStatus === "error"}
            onSave={() => {
              void saveActive();
            }}
          />
        ) : null}
      </div>

      <div className="flex flex-wrap items-center gap-1">
        <PublishStatusControl
          value={status}
          disabled={!canWrite}
          onChange={(nextStatus) => {
            if (!activeMeta || !canWrite) return;
            void updatePublishStatus(activeMeta.id, nextStatus);
          }}
        />

        {canWrite ? (
          <div
            className="inline-flex rounded-md border border-border p-0.5"
            role="group"
            aria-label="حالت سند"
          >
            {(
              [
                ["edit", "ویرایش"],
                ["read", "خواندن"],
              ] as const
            ).map(([mode, label]) => (
              <button
                key={mode}
                type="button"
                className={cn(
                  "rounded-sm px-2.5 py-1 text-xs transition-colors duration-150",
                  viewMode === mode
                    ? "bg-interactive-selected text-interactive-foreground"
                    : "text-muted-foreground hover:bg-interactive hover:text-interactive-foreground",
                )}
                onClick={() => setViewMode(mode)}
              >
                {label}
              </button>
            ))}
          </div>
        ) : (
          <span className="rounded-md border border-border px-2.5 py-1 text-xs text-muted-foreground">
            فقط خواندنی
          </span>
        )}

        <Button
          variant="ghost"
          size="icon"
          aria-label="فهرست مطالب"
          aria-pressed={outlineOpen}
          onClick={() => setOutlineOpen(!outlineOpen)}
        >
          <ListTree className="size-4" aria-hidden />
        </Button>
      </div>
    </div>
  );
}
