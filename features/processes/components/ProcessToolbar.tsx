"use client";

import {
  CheckCircle2,
  Redo2,
  Undo2,
  ZoomIn,
  ZoomOut,
} from "lucide-react";

import { PublishStatusControl } from "@/components/shared/publish-status-control";
import { SaveActionButton } from "@/components/shared/save-action-button";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import type { PublishStatus } from "@/features/documents/types";
import { useProcessStore } from "@/features/processes/hooks/use-process-store";
import { cn } from "@/lib/utils";

type ProcessToolbarProps = {
  topicTitle: string;
  readOnly?: boolean;
  onFitView: () => void;
  onCenter: () => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onAutoLayout: () => void;
  onValidate: () => void;
  onRename: (title: string) => void;
  onStatusChange: (status: PublishStatus) => void;
  onDuplicate: () => void;
  onExportJson: () => void;
  onExportPng: () => void;
  onClear: () => void;
  onDelete: () => void;
};

export function ProcessToolbar({
  topicTitle,
  readOnly = false,
  onFitView,
  onCenter,
  onZoomIn,
  onZoomOut,
  onAutoLayout,
  onValidate,
  onRename,
  onStatusChange,
  onDuplicate,
  onExportJson,
  onExportPng,
  onClear,
  onDelete,
}: ProcessToolbarProps) {
  const process = useProcessStore((s) => s.process);
  const viewMode = useProcessStore((s) => s.viewMode);
  const saveStatus = useProcessStore((s) => s.saveStatus);
  const isDirty = useProcessStore((s) => s.isDirty);
  const isSaving = useProcessStore((s) => s.isSaving);
  const save = useProcessStore((s) => s.save);
  const setViewMode = useProcessStore((s) => s.setViewMode);
  const setProcess = useProcessStore((s) => s.setProcess);
  const undo = useProcessStore((s) => s.undo);
  const redo = useProcessStore((s) => s.redo);
  const past = useProcessStore((s) => s.past);
  const future = useProcessStore((s) => s.future);

  if (!process) return null;

  return (
    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border bg-background px-3 py-2">
      <div className="flex min-w-0 flex-1 items-center gap-2">
        <span aria-hidden>{process.icon}</span>
        <div className="min-w-0">
          <Input
            value={process.title}
            onChange={(event) => onRename(event.target.value)}
            readOnly={readOnly}
            className="h-7 max-w-56 border-transparent bg-transparent px-1 font-medium hover:border-border focus-visible:border-border"
            aria-label="نام فرآیند"
          />
          <p className="truncate px-1 text-[11px] text-muted-foreground">
            {topicTitle} / {process.title}
          </p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-1">
        <PublishStatusControl
          value={process.status ?? "draft"}
          disabled={readOnly}
          onChange={(status) => {
            if (readOnly) return;
            setProcess({ ...process, status });
            onStatusChange(status);
          }}
        />

        {readOnly ? (
          <span className="rounded-md border border-border px-2.5 py-1 text-xs text-muted-foreground">
            فقط خواندنی
          </span>
        ) : (
          <div className="inline-flex rounded-md border border-border p-0.5">
            {(
              [
                ["design", "طراحی"],
                ["view", "مشاهده"],
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
        )}

        <Button
          variant="ghost"
          size="icon"
          aria-label="بازگردانی"
          disabled={readOnly || past.length === 0}
          onClick={undo}
        >
          <Undo2 className="size-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          aria-label="انجام مجدد"
          disabled={readOnly || future.length === 0}
          onClick={redo}
        >
          <Redo2 className="size-4" />
        </Button>
        <Button variant="ghost" size="icon" aria-label="بزرگ‌نمایی" onClick={onZoomIn}>
          <ZoomIn className="size-4" />
        </Button>
        <Button variant="ghost" size="icon" aria-label="کوچک‌نمایی" onClick={onZoomOut}>
          <ZoomOut className="size-4" />
        </Button>
        <Button variant="ghost" size="sm" onClick={onFitView}>
          نمایش کامل
        </Button>
        <Button variant="ghost" size="sm" onClick={onCenter}>
          مرکز
        </Button>
        <Button variant="ghost" size="sm" disabled={readOnly} onClick={onAutoLayout}>
          چیدمان خودکار
        </Button>
        <Button variant="ghost" size="sm" onClick={onValidate}>
          <CheckCircle2 className="size-4" />
          اعتبارسنجی
        </Button>

        {readOnly ? null : (
          <SaveActionButton
            dirty={isDirty}
            saving={isSaving}
            error={saveStatus === "error"}
            onSave={() => {
              void save();
            }}
          />
        )}

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm">
              بیشتر
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            {readOnly ? null : (
              <>
                <DropdownMenuItem
                  onClick={() => {
                    const next = window.prompt("نام جدید فرآیند", process.title);
                    if (next?.trim()) onRename(next.trim());
                  }}
                >
                  تغییر نام فرآیند
                </DropdownMenuItem>
                <DropdownMenuItem onClick={onDuplicate}>ایجاد رونوشت</DropdownMenuItem>
                <DropdownMenuSeparator />
              </>
            )}
            <DropdownMenuItem onClick={onExportJson}>خروجی JSON</DropdownMenuItem>
            <DropdownMenuItem onClick={onExportPng}>خروجی PNG</DropdownMenuItem>
            {readOnly ? null : (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={onClear}>پاک‌کردن بوم</DropdownMenuItem>
                <DropdownMenuItem
                  className="text-destructive focus:bg-destructive/10 focus:text-destructive"
                  onClick={onDelete}
                >
                  حذف فرآیند
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
