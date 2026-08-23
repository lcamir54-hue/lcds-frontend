"use client";

import { Save } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type SaveActionButtonProps = {
  dirty: boolean;
  saving?: boolean;
  error?: boolean;
  onSave: () => void;
  className?: string;
};

export function SaveActionButton({
  dirty,
  saving = false,
  error = false,
  onSave,
  className,
}: SaveActionButtonProps) {
  if (!dirty && !saving && !error) return null;

  return (
    <div className="flex items-center gap-2">
      {dirty && !saving ? (
        <span className="hidden text-xs font-medium text-primary sm:inline">
          تغییرات ذخیره‌نشده
        </span>
      ) : null}
      <Button
        type="button"
        size="sm"
        isLoading={saving}
        className={cn(
          "shadow-sm",
          dirty &&
            !saving &&
            "ring-2 ring-primary/35 ring-offset-2 ring-offset-background",
          className,
        )}
        aria-label="ذخیره تغییرات"
        onClick={onSave}
      >
        {saving ? null : <Save className="size-3.5" aria-hidden />}
        {saving ? "در حال ذخیره…" : error ? "تلاش مجدد ذخیره" : "ذخیره"}
      </Button>
    </div>
  );
}
