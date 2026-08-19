"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import * as React from "react";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
import { Textarea } from "@/components/ui/textarea";

const demoFormSchema = z.object({
  title: z.string().min(2, "عنوان باید حداقل ۲ کاراکتر باشد"),
  department: z.string().min(1, "انتخاب واحد الزامی است"),
  notes: z.string().optional(),
  notify: z.boolean(),
});

type DemoFormValues = z.infer<typeof demoFormSchema>;

export function DemoForm() {
  const [open, setOpen] = React.useState(false);
  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<DemoFormValues>({
    resolver: zodResolver(demoFormSchema),
    defaultValues: {
      title: "",
      department: "",
      notes: "",
      notify: true,
    },
  });

  const onSubmit = handleSubmit(async () => {
    await new Promise((resolve) => setTimeout(resolve, 600));
    reset();
    setOpen(false);
  });

  return (
    <form
      onSubmit={onSubmit}
      className="mx-auto flex max-w-lg flex-col gap-4"
      noValidate
    >
      <div className="space-y-1.5">
        <Label htmlFor="title">عنوان درخواست</Label>
        <Input
          id="title"
          placeholder="مثلاً درخواست دسترسی به سند بودجه"
          aria-invalid={Boolean(errors.title)}
          {...register("title")}
        />
        {errors.title ? (
          <p className="text-xs text-destructive">{errors.title.message}</p>
        ) : null}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="department">واحد سازمانی</Label>
        <Controller
          name="department"
          control={control}
          render={({ field }) => (
            <Select value={field.value} onValueChange={field.onChange}>
              <SelectTrigger
                id="department"
                aria-invalid={Boolean(errors.department)}
              >
                <SelectValue placeholder="انتخاب کنید" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="hr">منابع انسانی</SelectItem>
                <SelectItem value="finance">مالی</SelectItem>
                <SelectItem value="ops">عملیات</SelectItem>
              </SelectContent>
            </Select>
          )}
        />
        {errors.department ? (
          <p className="text-xs text-destructive">
            {errors.department.message}
          </p>
        ) : null}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="notes">توضیحات</Label>
        <Textarea
          id="notes"
          placeholder="جزئیات تکمیلی را اینجا بنویسید…"
          {...register("notes")}
        />
      </div>

      <div className="flex items-center gap-2">
        <Controller
          name="notify"
          control={control}
          render={({ field }) => (
            <Checkbox
              id="notify"
              checked={field.value}
              onCheckedChange={(checked) => field.onChange(checked === true)}
            />
          )}
        />
        <Label htmlFor="notify" className="font-normal">
          پس از ثبت، به من اطلاع داده شود
        </Label>
      </div>

      <div className="flex flex-wrap items-center gap-2 pt-1">
        <Button type="submit" isLoading={isSubmitting}>
          ثبت درخواست
        </Button>

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button type="button" variant="outline">
              راهنما
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>راهنمای ثبت درخواست</DialogTitle>
              <DialogDescription>
                عنوان را کوتاه و واضح بنویسید و واحد مرتبط را انتخاب کنید. ایمیل
                سازمانی شما به صورت{" "}
                <span className="ltr-isolate">user@example.com</span> در
                اعلان‌ها استفاده می‌شود.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button type="button" onClick={() => setOpen(false)}>
                متوجه شدم
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </form>
  );
}
