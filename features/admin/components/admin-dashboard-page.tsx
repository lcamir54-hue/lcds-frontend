"use client";

import * as React from "react";

import { AdminWorkspace } from "@/features/admin/components/admin-workspace";
import { getAdminStats } from "@/lib/api/admin";
import { getErrorDetail } from "@/lib/api/errors";
import type { AdminStats } from "@/lib/api/types";

const STAT_LABELS: { key: keyof AdminStats; label: string }[] = [
  { key: "users", label: "کاربران" },
  { key: "groups", label: "گروه‌ها" },
  { key: "topics", label: "عنوان‌ها" },
  { key: "pages", label: "صفحات" },
  { key: "processes", label: "فرآیندها" },
];

export function AdminDashboardPage() {
  const [stats, setStats] = React.useState<AdminStats | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    let cancelled = false;
    void getAdminStats()
      .then((next) => {
        if (cancelled) return;
        setStats(next);
      })
      .catch((err) => {
        if (cancelled) return;
        setError(getErrorDetail(err, "بارگذاری آمار ناموفق بود"));
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <AdminWorkspace
      title="داشبورد"
      description="شمارنده‌های سیستم از API مدیریت"
    >
      {error ? (
        <div
          role="alert"
          className="mb-4 rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive"
        >
          {error}
        </div>
      ) : null}

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {STAT_LABELS.map((item) => (
          <div
            key={item.key}
            className="rounded-md border border-border bg-surface px-4 py-3"
          >
            <p className="text-xs text-muted-foreground">{item.label}</p>
            <p className="mt-1 text-2xl font-semibold tabular-nums">
              {stats ? stats[item.key] : "—"}
            </p>
          </div>
        ))}
      </div>
    </AdminWorkspace>
  );
}
