"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import * as React from "react";
import { useForm } from "react-hook-form";

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
import { Textarea } from "@/components/ui/textarea";
import {
  groupFormSchema,
  type GroupFormValues,
  type ManagedGroup,
  type ManagedUser,
} from "@/features/admin/types";
import { cn } from "@/lib/utils";

type GroupFormDialogProps = {
  open: boolean;
  group: ManagedGroup | null;
  users: ManagedUser[];
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: GroupFormValues) => Promise<void>;
};

function GroupFormFields({
  group,
  users,
  onCancel,
  onSubmit,
}: {
  group: ManagedGroup | null;
  users: ManagedUser[];
  onCancel: () => void;
  onSubmit: (values: GroupFormValues) => Promise<void>;
}) {
  const isEdit = Boolean(group);
  const [memberIds, setMemberIds] = React.useState<string[]>(
    () => group?.memberIds ?? [],
  );

  const form = useForm<GroupFormValues>({
    resolver: zodResolver(groupFormSchema),
    defaultValues: {
      name: group?.name ?? "",
      description: group?.description ?? "",
      memberIds: group?.memberIds ?? [],
    },
  });

  const toggleMember = (userId: string, checked: boolean) => {
    setMemberIds((current) => {
      const next = checked
        ? [...current, userId]
        : current.filter((id) => id !== userId);
      form.setValue("memberIds", next, { shouldDirty: true });
      return next;
    });
  };

  const handleSubmit = form.handleSubmit(async (values) => {
    try {
      await onSubmit({ ...values, memberIds });
    } catch (err) {
      form.setError("root", {
        message: err instanceof Error ? err.message : "عملیات ناموفق بود",
      });
    }
  });

  return (
    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
      <DialogHeader>
        <DialogTitle>{isEdit ? "ویرایش گروه" : "گروه جدید"}</DialogTitle>
        <DialogDescription>
          {isEdit
            ? "نام، توضیح و اعضای گروه را به‌روزرسانی کنید."
            : "گروه جدید بسازید و کاربران را به آن اختصاص دهید."}
        </DialogDescription>
      </DialogHeader>

      <div className="space-y-1.5">
        <Label htmlFor="group-name">نام گروه</Label>
        <Input
          id="group-name"
          autoFocus
          aria-invalid={Boolean(form.formState.errors.name)}
          {...form.register("name")}
        />
        {form.formState.errors.name ? (
          <p className="text-xs text-destructive">
            {form.formState.errors.name.message}
          </p>
        ) : null}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="group-description">توضیحات</Label>
        <Textarea
          id="group-description"
          rows={3}
          placeholder="هدف یا محدوده این گروه"
          {...form.register("description")}
        />
      </div>

      <div className="space-y-2">
        <Label>اعضای گروه</Label>
        <ScrollArea className="h-44 rounded-md border border-border">
          <div className="space-y-1 p-2">
            {users.length === 0 ? (
              <p className="px-1 py-2 text-xs text-muted-foreground">
                کاربری برای اختصاص وجود ندارد.
              </p>
            ) : (
              users.map((user) => {
                const checked = memberIds.includes(user.id);
                return (
                  <label
                    key={user.id}
                    className={cn(
                      "flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 transition-colors duration-150 hover:bg-interactive hover:text-interactive-foreground",
                      checked &&
                        "bg-interactive-selected text-interactive-foreground",
                    )}
                  >
                    <Checkbox
                      checked={checked}
                      onCheckedChange={(value) =>
                        toggleMember(user.id, value === true)
                      }
                      aria-label={`عضویت ${user.fullName}`}
                    />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm">
                        {user.fullName}
                      </span>
                      <span
                        className="block truncate text-[11px] text-muted-foreground"
                        dir="ltr"
                      >
                        {user.username}
                      </span>
                    </span>
                  </label>
                );
              })
            )}
          </div>
        </ScrollArea>
        <p className="text-[11px] text-muted-foreground">
          {memberIds.length} عضو انتخاب شده
        </p>
      </div>

      {form.formState.errors.root ? (
        <p className="text-sm text-destructive" role="alert">
          {form.formState.errors.root.message}
        </p>
      ) : null}

      <DialogFooter>
        <Button type="button" variant="outline" onClick={onCancel}>
          انصراف
        </Button>
        <Button type="submit" isLoading={form.formState.isSubmitting}>
          {isEdit ? "ذخیره تغییرات" : "ایجاد گروه"}
        </Button>
      </DialogFooter>
    </form>
  );
}

export function GroupFormDialog({
  open,
  group,
  users,
  onOpenChange,
  onSubmit,
}: GroupFormDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        {open ? (
          <GroupFormFields
            key={group?.id ?? "new-group"}
            group={group}
            users={users}
            onCancel={() => onOpenChange(false)}
            onSubmit={async (values) => {
              await onSubmit(values);
              onOpenChange(false);
            }}
          />
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
