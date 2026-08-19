"use client";

import * as React from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { defaultIconForKind } from "@/features/documents/lib/frontmatter";
import type { DocumentKind } from "@/features/documents/types";
import { TOPIC_ICON_OPTIONS } from "@/features/documents/types";
import { cn } from "@/lib/utils";

type CreateChildDialogProps = {
  open: boolean;
  kind: "page" | "process";
  topicTitle: string;
  onOpenChange: (open: boolean) => void;
  onSubmit: (input: { title: string; icon: string }) => Promise<void> | void;
};

function CreateChildForm({
  kind,
  topicTitle,
  onCancel,
  onSubmit,
}: {
  kind: "page" | "process";
  topicTitle: string;
  onCancel: () => void;
  onSubmit: (input: { title: string; icon: string }) => Promise<void> | void;
}) {
  const [title, setTitle] = React.useState("");
  const [icon, setIcon] = React.useState(defaultIconForKind(kind));
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const isPage = kind === "page";

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    const trimmed = title.trim();
    if (!trimmed) return;

    setIsSubmitting(true);
    try {
      await onSubmit({ title: trimmed, icon });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <DialogHeader>
        <DialogTitle>{isPage ? "صفحه جدید" : "فرآیند جدید"}</DialogTitle>
        <DialogDescription>
          نام {isPage ? "صفحه" : "فرآیند"} را وارد کنید تا زیرمجموعهٔ «
          {topicTitle}» ایجاد شود.
        </DialogDescription>
      </DialogHeader>

      {!isPage ? (
        <div className="space-y-2">
          <Label>آیکون فرآیند</Label>
          <div className="grid grid-cols-8 gap-1.5">
            {TOPIC_ICON_OPTIONS.map((option) => (
              <button
                key={option}
                type="button"
                className={cn(
                  "flex size-8 items-center justify-center rounded-md border text-base transition-colors duration-150 hover:bg-interactive hover:text-interactive-foreground",
                  icon === option
                    ? "border-interactive-ring bg-interactive-selected text-interactive-foreground"
                    : "border-transparent bg-surface",
                )}
                aria-label={`انتخاب آیکون ${option}`}
                aria-pressed={icon === option}
                onClick={() => setIcon(option)}
              >
                {option}
              </button>
            ))}
          </div>
        </div>
      ) : null}

      <div className="space-y-2">
        <Label htmlFor="child-title">
          {isPage ? "نام صفحه" : "نام فرآیند"}
        </Label>
        <Input
          id="child-title"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          placeholder={isPage ? "مثلاً معرفی" : "مثلاً فرآیند تأیید"}
          autoFocus
          required
        />
      </div>

      <DialogFooter>
        <Button type="button" variant="outline" onClick={onCancel}>
          انصراف
        </Button>
        <Button type="submit" isLoading={isSubmitting} disabled={!title.trim()}>
          {isPage ? "ایجاد صفحه" : "ایجاد فرآیند"}
        </Button>
      </DialogFooter>
    </form>
  );
}

export function CreateChildDialog({
  open,
  kind,
  topicTitle,
  onOpenChange,
  onSubmit,
}: CreateChildDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        {open ? (
          <CreateChildForm
            key={`${kind}-${topicTitle}`}
            kind={kind}
            topicTitle={topicTitle}
            onCancel={() => onOpenChange(false)}
            onSubmit={async (input) => {
              await onSubmit(input);
              onOpenChange(false);
            }}
          />
        ) : null}
      </DialogContent>
    </Dialog>
  );
}

export type CreateChildKind = Extract<DocumentKind, "page" | "process">;
