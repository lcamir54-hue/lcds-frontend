import { FileText, Inbox } from "lucide-react";
import type * as React from "react";

import { EmptyState } from "@/components/shared/empty-state";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const sampleItems = [
  {
    id: "1",
    title: "صورتجلسه کمیته راهبری",
    meta: "به‌روزرسانی شده ۲ ساعت پیش",
    status: "فعال",
  },
  {
    id: "2",
    title: "چک‌لیست آماده‌سازی فصل جدید",
    meta: "مسئول: تیم عملیات",
    status: "در انتظار",
  },
  {
    id: "3",
    title: "پیش‌نویس سیاست دسترسی اسناد",
    meta: "نسخه ۰٫۳",
    status: "پیش‌نویس",
  },
] as const;

type DemoPageBodyProps = {
  form: React.ReactNode;
};

export function DemoPageBody({ form }: DemoPageBodyProps) {
  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-10">
      <header className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          پایهٔ رابط کاربری
        </h1>
        <p className="max-w-2xl text-sm text-muted-foreground">
          این صفحه فقط برای اعتبارسنجی معماری فرانت‌اند، پشتیبانی راست‌به‌چپ،
          توکن‌های طراحی و مؤلفه‌های پایه است — نه یک داشبورد محصول.
        </p>
        <p className="text-xs text-muted-foreground">
          نمونهٔ ایزولهٔ چپ‌به‌راست:{" "}
          <span className="ltr-isolate">https://example.com/docs</span> ·{" "}
          <span className="ltr-isolate">۱۲۳۴۵</span>
        </p>
      </header>

      <section className="space-y-3" aria-labelledby="form-heading">
        <div className="space-y-1">
          <h2 id="form-heading" className="text-base font-medium">
            فرم نمونه
          </h2>
          <p className="text-sm text-muted-foreground">
            اعتبارسنجی با React Hook Form و Zod
          </p>
        </div>
        {form}
      </section>

      <Separator />

      <section className="space-y-3" aria-labelledby="list-heading">
        <div className="flex items-center justify-between gap-3">
          <div className="space-y-1">
            <h2 id="list-heading" className="text-base font-medium">
              فهرست محتوا
            </h2>
            <p className="text-sm text-muted-foreground">
              لیست مینیمال بدون کارت‌های پرزرق‌وبرق
            </p>
          </div>
          <Tooltip>
            <TooltipTrigger asChild>
              <Badge variant="secondary">۳ مورد</Badge>
            </TooltipTrigger>
            <TooltipContent>تعداد اسناد نمایش‌داده‌شده</TooltipContent>
          </Tooltip>
        </div>

        <ul className="divide-y divide-border border-y border-border">
          {sampleItems.map((item) => (
            <li
              key={item.id}
              className="flex items-start justify-between gap-4 py-3"
            >
              <div className="flex min-w-0 items-start gap-2">
                <FileText
                  className="mt-0.5 size-4 shrink-0 text-muted-foreground"
                  aria-hidden
                />
                <div className="min-w-0 space-y-0.5">
                  <p className="truncate text-sm font-medium">{item.title}</p>
                  <p className="text-xs text-muted-foreground">{item.meta}</p>
                </div>
              </div>
              <Badge variant="outline">{item.status}</Badge>
            </li>
          ))}
        </ul>
      </section>

      <section className="grid gap-8 md:grid-cols-2" aria-label="حالت‌های کمکی">
        <div className="space-y-3">
          <h2 className="text-base font-medium">حالت بارگذاری</h2>
          <div
            className="space-y-2"
            aria-busy="true"
            aria-label="در حال بارگذاری"
          >
            <Skeleton className="h-4 w-2/3" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
          </div>
        </div>

        <div className="space-y-3">
          <h2 className="text-base font-medium">حالت خالی</h2>
          <EmptyState
            icon={<Inbox />}
            title="موردی یافت نشد"
            description="هنوز سندی در این بخش ثبت نشده است. پس از ایجاد اولین مورد، اینجا نمایش داده می‌شود."
          />
        </div>
      </section>
    </div>
  );
}
