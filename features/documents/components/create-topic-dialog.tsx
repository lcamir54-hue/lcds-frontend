"use client";

import * as React from "react";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
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
import { ScrollArea } from "@/components/ui/scroll-area";
import { getErrorDetail } from "@/lib/api/errors";
import { listAclGroups } from "@/lib/api/groups";
import type { AclGroup } from "@/lib/api/types";
import { cn } from "@/lib/utils";

export type CreateTopicInput = {
  title: string;
  allowedGroupIds: string[];
};

type CreateTopicDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (input: CreateTopicInput) => Promise<void> | void;
};

function CreateTopicForm({
  onCancel,
  onSubmit,
}: {
  onCancel: () => void;
  onSubmit: (input: CreateTopicInput) => Promise<void> | void;
}) {
  const [title, setTitle] = React.useState("");
  const [allowedGroupIds, setAllowedGroupIds] = React.useState<string[]>([]);
  const [groups, setGroups] = React.useState<AclGroup[]>([]);
  const [groupsLoaded, setGroupsLoaded] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    let cancelled = false;
    void listAclGroups()
      .then((result) => {
        if (cancelled) return;
        setGroups(result.items);
        setGroupsLoaded(true);
      })
      .catch((err) => {
        if (cancelled) return;
        setError(getErrorDetail(err, "بارگذاری گروه‌ها ناموفق بود"));
        setGroupsLoaded(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const toggleGroup = (groupId: string, checked: boolean) => {
    setAllowedGroupIds((current) =>
      checked
        ? [...current, groupId]
        : current.filter((id) => id !== groupId),
    );
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    const trimmed = title.trim();
    if (!trimmed || allowedGroupIds.length === 0) return;

    setIsSubmitting(true);
    setError(null);
    try {
      await onSubmit({ title: trimmed, allowedGroupIds });
    } catch (err) {
      setError(getErrorDetail(err, "ایجاد عنوان ناموفق بود"));
      throw err;
    } finally {
      setIsSubmitting(false);
    }
  };

  const canSubmit = Boolean(title.trim()) && allowedGroupIds.length > 0;

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <DialogHeader>
        <DialogTitle>عنوان جدید</DialogTitle>
        <DialogDescription>
          یک عنوان دانش انتخاب کنید و مشخص کنید کدام گروه‌ها به محتوای آن دسترسی
          دارند. صفحات و فرآیندها همین دسترسی را به ارث می‌برند.
        </DialogDescription>
      </DialogHeader>

      <div className="space-y-2">
        <Label htmlFor="topic-title">عنوان موضوع</Label>
        <Input
          id="topic-title"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          placeholder="مثلاً سیاست منابع انسانی"
          autoFocus
          required
        />
      </div>

      <div className="space-y-2">
        <Label>گروه‌های مجاز</Label>
        <ScrollArea className="h-44 rounded-md border border-border">
          <div className="space-y-1 p-2">
            {!groupsLoaded ? (
              <p className="px-1 py-2 text-xs text-muted-foreground">
                در حال بارگذاری گروه‌ها…
              </p>
            ) : groups.length === 0 ? (
              <p className="px-1 py-2 text-xs text-muted-foreground">
                گروهی تعریف نشده است. ابتدا از بخش مدیریت، گروه بسازید.
              </p>
            ) : (
              groups.map((group) => {
                const checked = allowedGroupIds.includes(group.id);
                return (
                  <label
                    key={group.id}
                    className={cn(
                      "flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 transition-colors duration-150 hover:bg-interactive hover:text-interactive-foreground",
                      checked &&
                        "bg-interactive-selected text-interactive-foreground",
                    )}
                  >
                    <Checkbox
                      checked={checked}
                      onCheckedChange={(value) =>
                        toggleGroup(group.id, value === true)
                      }
                      aria-label={`دسترسی ${group.name}`}
                    />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm">{group.name}</span>
                      {group.description ? (
                        <span className="block truncate text-[11px] text-muted-foreground">
                          {group.description}
                        </span>
                      ) : null}
                    </span>
                  </label>
                );
              })
            )}
          </div>
        </ScrollArea>
        <p className="text-[11px] text-muted-foreground">
          انتخاب حداقل یک گروه الزامی است. اعضای این گروه‌ها محتوا را فقط می‌خوانند؛
          ویرایش فقط برای مالک سند و مدیران است.
        </p>
      </div>

      {error ? (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : null}

      <DialogFooter>
        <Button type="button" variant="outline" onClick={onCancel}>
          انصراف
        </Button>
        <Button type="submit" isLoading={isSubmitting} disabled={!canSubmit}>
          ایجاد عنوان
        </Button>
      </DialogFooter>
    </form>
  );
}

export function CreateTopicDialog({
  open,
  onOpenChange,
  onSubmit,
}: CreateTopicDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        {open ? (
          <CreateTopicForm
            key={String(open)}
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
