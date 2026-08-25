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
import { ScrollArea } from "@/components/ui/scroll-area";
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

const PAGE_GUIDE = {
  title: "راهنمای ثبت دانش",
  intro:
    "همکار گرامی، برای ثبت مؤثر دانش و کمک به پردازش و بازیابی دقیق‌تر اطلاعات در سیستم، لطفاً نکات زیر را در نظر داشته باشید:",
  items: [
    "محتوای هر صفحه باید از نظر مفهومی، معنایی و موضوعی یکپارچه و کاملاً مرتبط باشد.",
    "هر عنوان اصلی (H1) به‌عنوان یک دانش مستقل در نظر گرفته می‌شود و ظرفیت مشخصی برای ثبت محتوا دارد.",
    "از قرار دادن موضوعات پراکنده یا نامرتبط در یک صفحه خودداری کنید.",
    "در صورت تغییر موضوع اصلی، آن را در یک صفحه دانش جداگانه ثبت نمایید.",
    "عنوانی روشن، دقیق و متناسب با محتوای صفحه انتخاب کنید.",
  ],
  outro:
    "رعایت این اصول به سازمان‌دهی بهتر دانش و ارائه پاسخ‌های دقیق‌تر توسط سیستم کمک می‌کند.",
} as const;

const PROCESS_GUIDE = {
  title: "راهنمای ثبت فرآیند",
  intro:
    "همکار گرامی، برای ثبت یک فرآیند شفاف، قابل‌فهم و قابل‌استفاده، لطفاً نکات زیر را در نظر داشته باشید:",
  items: [
    "هر فرآیند باید یک هدف مشخص و مستقل داشته باشد.",
    "مراحل فرآیند را به‌ترتیب اجرا، با توضیحاتی کوتاه، روشن و صریح ثبت کنید.",
    "نقطه شروع، مراحل تصمیم‌گیری، مسئولیت افراد و نقطه پایان فرآیند را به‌وضوح مشخص نمایید.",
    "از ترکیب چند فرآیند مستقل در یک نمودار خودداری کنید و برای هرکدام فرآیندی جداگانه بسازید.",
    "چیدمان مرتب، مسیرهای مشخص و تفکیک صحیح مراحل، اهمیت بسیار بالایی دارد.",
    "از ایجاد مسیرهای پیچیده، تکراری یا غیرضروری پرهیز کنید.",
  ],
  outro:
    "شفافیت و نظم در طراحی فرآیند، اجرای صحیح آن و درک مشترک میان واحدهای سازمان را امکان‌پذیر می‌سازد.",
} as const;

function CreationGuide({ kind }: { kind: "page" | "process" }) {
  const guide = kind === "page" ? PAGE_GUIDE : PROCESS_GUIDE;

  return (
    <aside className="overflow-hidden rounded-md border border-border bg-surface">
      <div
        dir="rtl"
        className="border-b border-border bg-muted/50 px-3 py-2 text-right"
      >
        <p className="text-sm font-medium text-foreground">{guide.title}</p>
      </div>
      <ScrollArea className="h-[min(36vh,260px)]">
        <div
          dir="rtl"
          lang="fa"
          className="space-y-2.5 px-3 py-3 text-right text-sm leading-7 text-muted-foreground"
          style={{ direction: "rtl" }}
        >
          <p>{guide.intro}</p>
          <ul className="list-disc space-y-1.5 pe-1 ps-5 text-right marker:text-foreground/50">
            {guide.items.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
          <p>{guide.outro}</p>
        </div>
      </ScrollArea>
    </aside>
  );
}

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

      <CreationGuide kind={kind} />

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
      <DialogContent className="max-w-lg">
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
