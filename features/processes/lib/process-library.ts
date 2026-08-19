import type { ProcessObjectType } from "@/features/processes/types/process.types";

export type ProcessLibraryItem = {
  type: ProcessObjectType;
  label: string;
  description: string;
  icon: string;
  color: string;
};

export type ProcessLibraryCategory = {
  id: string;
  label: string;
  items: ProcessLibraryItem[];
};

export const PROCESS_LIBRARY: ProcessLibraryCategory[] = [
  {
    id: "flow",
    label: "کنترل جریان",
    items: [
      { type: "start", label: "شروع", description: "نقطه آغاز فرآیند", icon: "▶️", color: "green" },
      { type: "end", label: "پایان", description: "نقطه پایان فرآیند", icon: "⏹", color: "red" },
      { type: "action", label: "اقدام", description: "گام اجرایی فرآیند", icon: "⚡", color: "blue" },
      { type: "decision", label: "تصمیم", description: "شاخه‌بندی تصمیم", icon: "◇", color: "amber" },
      { type: "condition", label: "شرط", description: "بررسی شرط منطقی", icon: "❓", color: "amber" },
      { type: "wait", label: "انتظار", description: "توقف تا رخداد", icon: "⏸", color: "amber" },
      { type: "delay", label: "تأخیر زمانی", description: "تأخیر زمان‌دار", icon: "⏱", color: "amber" },
      { type: "merge", label: "ادغام مسیرها", description: "ادغام شاخه‌ها", icon: "合流", color: "blue" },
      { type: "split", label: "انشعاب", description: "تقسیم مسیر", icon: "⎇", color: "blue" },
      { type: "subprocess", label: "فرآیند فرعی", description: "ارجاع به فرآیند دیگر", icon: "📦", color: "purple" },
    ],
  },
  {
    id: "people",
    label: "افراد و مسئولیت",
    items: [
      { type: "user", label: "کاربر", description: "کاربر مشخص", icon: "👤", color: "blue" },
      { type: "role", label: "نقش سازمانی", description: "نقش سازمانی", icon: "🪪", color: "blue" },
      { type: "department", label: "واحد سازمانی", description: "واحد سازمان", icon: "🏢", color: "blue" },
      { type: "approver", label: "تأییدکننده", description: "مسئول تأیید", icon: "✅", color: "green" },
      { type: "assignee", label: "مسئول اجرا", description: "مجری اقدام", icon: "🧑‍💼", color: "blue" },
      { type: "reviewer", label: "بازبین", description: "مسئول بازبینی", icon: "🔎", color: "amber" },
    ],
  },
  {
    id: "data",
    label: "داده و اسناد",
    items: [
      { type: "data-input", label: "ورودی داده", description: "دریافت داده", icon: "📥", color: "blue" },
      { type: "data-output", label: "خروجی داده", description: "تولید داده", icon: "📤", color: "blue" },
      { type: "document", label: "سند", description: "سند مرتبط", icon: "📄", color: "neutral" },
      { type: "form", label: "فرم", description: "فرم سازمانی", icon: "🧾", color: "neutral" },
      { type: "database", label: "پایگاه داده", description: "منبع داده", icon: "🗄️", color: "purple" },
      { type: "file", label: "فایل", description: "فایل پیوست", icon: "📁", color: "neutral" },
      { type: "report", label: "گزارش", description: "خروجی گزارش", icon: "📊", color: "blue" },
    ],
  },
  {
    id: "communication",
    label: "ارتباطات",
    items: [
      { type: "send-message", label: "ارسال پیام", description: "ارسال پیام", icon: "💬", color: "blue" },
      { type: "email", label: "ایمیل", description: "ارسال ایمیل", icon: "✉️", color: "blue" },
      { type: "notification", label: "اعلان", description: "اعلان سیستمی", icon: "🔔", color: "amber" },
      { type: "request", label: "درخواست", description: "ثبت درخواست", icon: "📨", color: "blue" },
      { type: "response", label: "پاسخ", description: "پاسخ درخواست", icon: "📩", color: "green" },
    ],
  },
  {
    id: "systems",
    label: "سامانه‌ها",
    items: [
      { type: "internal-system", label: "سیستم داخلی", description: "سامانه داخلی", icon: "🖥️", color: "blue" },
      { type: "external-service", label: "سرویس خارجی", description: "سرویس بیرونی", icon: "☁️", color: "purple" },
      { type: "api", label: "API", description: "فراخوانی API", icon: "🔌", color: "purple" },
      { type: "automation", label: "عملیات خودکار", description: "اتوماسیون", icon: "🤖", color: "purple" },
      { type: "manual-task", label: "عملیات دستی", description: "کار دستی", icon: "🖐️", color: "amber" },
    ],
  },
  {
    id: "diagram",
    label: "عناصر نمودار",
    items: [
      { type: "note", label: "یادداشت", description: "یادداشت توضیحی", icon: "📝", color: "neutral" },
      { type: "group", label: "گروه", description: "گروه‌بندی گره‌ها", icon: "⬚", color: "neutral" },
      { type: "container", label: "محدوده", description: "محدوده بصری", icon: "▭", color: "neutral" },
      { type: "guide", label: "خط راهنما", description: "راهنمای تراز", icon: "━", color: "neutral" },
      { type: "label", label: "برچسب", description: "برچسب متنی", icon: "🏷️", color: "neutral" },
      { type: "swimlane", label: "مسیر شناور", description: "مسیر مسئولیت", icon: "☰", color: "neutral" },
    ],
  },
];

export function findLibraryItem(type: ProcessObjectType) {
  for (const category of PROCESS_LIBRARY) {
    const item = category.items.find((entry) => entry.type === type);
    if (item) return item;
  }
  return null;
}
