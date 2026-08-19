"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import * as React from "react";
import { Controller, useForm } from "react-hook-form";

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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  type ManagedUser,
  ROLE_LABELS,
  userFormSchema,
  type UserFormValues,
} from "@/features/admin/types";

type UserFormDialogProps = {
  open: boolean;
  user: ManagedUser | null;
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: UserFormValues) => Promise<void>;
};

export function UserFormDialog({
  open,
  user,
  onOpenChange,
  onSubmit,
}: UserFormDialogProps) {
  const isEdit = Boolean(user);
  const form = useForm<UserFormValues>({
    resolver: zodResolver(userFormSchema),
    defaultValues: {
      username: "",
      fullName: "",
      email: "",
      role: "user",
      password: "",
      isActive: true,
    },
  });

  React.useEffect(() => {
    if (!open) return;
    form.reset(
      user
        ? {
            username: user.username,
            fullName: user.fullName,
            email: user.email,
            role: user.role,
            password: "",
            isActive: user.isActive,
          }
        : {
            username: "",
            fullName: "",
            email: "",
            role: "user",
            password: "",
            isActive: true,
          },
    );
  }, [form, open, user]);

  const handleSubmit = form.handleSubmit(async (values) => {
    if (!isEdit && values.password.trim().length < 4) {
      form.setError("password", {
        message: "رمز عبور باید حداقل ۴ کاراکتر باشد",
      });
      return;
    }
    if (isEdit && values.password.trim() && values.password.trim().length < 4) {
      form.setError("password", {
        message: "رمز عبور باید حداقل ۴ کاراکتر باشد",
      });
      return;
    }

    try {
      await onSubmit(values);
      onOpenChange(false);
    } catch (err) {
      form.setError("root", {
        message: err instanceof Error ? err.message : "عملیات ناموفق بود",
      });
    }
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          <DialogHeader>
            <DialogTitle>{isEdit ? "ویرایش کاربر" : "کاربر جدید"}</DialogTitle>
            <DialogDescription>
              {isEdit
                ? "اطلاعات کاربر را به‌روزرسانی کنید."
                : "کاربر جدید را به سیستم اضافه کنید."}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-1.5">
            <Label htmlFor="user-fullName">نام کامل</Label>
            <Input
              id="user-fullName"
              autoFocus
              aria-invalid={Boolean(form.formState.errors.fullName)}
              {...form.register("fullName")}
            />
            {form.formState.errors.fullName ? (
              <p className="text-xs text-destructive">
                {form.formState.errors.fullName.message}
              </p>
            ) : null}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="user-username">نام کاربری</Label>
            <Input
              id="user-username"
              dir="ltr"
              className="text-start"
              aria-invalid={Boolean(form.formState.errors.username)}
              {...form.register("username")}
            />
            {form.formState.errors.username ? (
              <p className="text-xs text-destructive">
                {form.formState.errors.username.message}
              </p>
            ) : null}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="user-email">ایمیل</Label>
            <Input
              id="user-email"
              type="email"
              dir="ltr"
              className="text-start"
              placeholder="optional@example.com"
              aria-invalid={Boolean(form.formState.errors.email)}
              {...form.register("email")}
            />
            {form.formState.errors.email ? (
              <p className="text-xs text-destructive">
                {form.formState.errors.email.message}
              </p>
            ) : null}
          </div>

          <div className="space-y-1.5">
            <Label>نقش</Label>
            <Controller
              control={form.control}
              name="role"
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger aria-label="نقش کاربر">
                    <SelectValue placeholder="انتخاب نقش" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">{ROLE_LABELS.admin}</SelectItem>
                    <SelectItem value="user">{ROLE_LABELS.user}</SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="user-password">
              {isEdit ? "رمز عبور جدید (اختیاری)" : "رمز عبور"}
            </Label>
            <Input
              id="user-password"
              type="password"
              dir="ltr"
              className="text-start"
              aria-invalid={Boolean(form.formState.errors.password)}
              {...form.register("password")}
            />
            {form.formState.errors.password ? (
              <p className="text-xs text-destructive">
                {form.formState.errors.password.message}
              </p>
            ) : null}
          </div>

          {isEdit ? (
            <div className="flex items-center gap-2">
              <Controller
                control={form.control}
                name="isActive"
                render={({ field }) => (
                  <Checkbox
                    id="user-active"
                    checked={field.value}
                    onCheckedChange={(value) => field.onChange(value === true)}
                  />
                )}
              />
              <Label htmlFor="user-active">حساب فعال است</Label>
            </div>
          ) : null}

          {form.formState.errors.root ? (
            <p className="text-sm text-destructive" role="alert">
              {form.formState.errors.root.message}
            </p>
          ) : null}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              انصراف
            </Button>
            <Button type="submit" isLoading={form.formState.isSubmitting}>
              {isEdit ? "ذخیره تغییرات" : "ایجاد کاربر"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
