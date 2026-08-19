"use client";

import {
  FileText,
  FolderOpen,
  LayoutDashboard,
  PanelRightClose,
  PanelRightOpen,
  Settings,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import * as React from "react";

import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useSidebarStore } from "@/hooks/use-sidebar-store";
import { APP_NAME } from "@/lib/constants";
import { cn } from "@/lib/utils";

const navItems = [
  { title: "نمای کلی", href: "/", icon: LayoutDashboard },
  { title: "اسناد", href: "#docs", icon: FileText },
  { title: "پروژه‌ها", href: "#projects", icon: FolderOpen },
  { title: "تنظیمات", href: "#settings", icon: Settings },
] as const;

export function AppSidebar() {
  const pathname = usePathname();
  const { isOpen, isMobileOpen, setMobileOpen, toggle } = useSidebarStore();

  return (
    <>
      {isMobileOpen ? (
        <button
          type="button"
          className="fixed inset-0 z-40 bg-overlay md:hidden"
          aria-label="بستن منو"
          onClick={() => setMobileOpen(false)}
        />
      ) : null}

      <aside
        className={cn(
          "fixed inset-y-0 start-0 z-50 flex w-[var(--sidebar-width)] flex-col border-e border-border bg-surface transition-[transform,width] duration-200 md:static md:z-0",
          isOpen ? "md:w-[var(--sidebar-width)]" : "md:w-14",
          isMobileOpen
            ? "translate-x-0"
            : "-translate-x-full md:translate-x-0 rtl:translate-x-full",
        )}
      >
        <div className="flex h-[var(--header-height)] items-center justify-between gap-2 px-3">
          <Link
            href="/"
            className={cn(
              "truncate text-sm font-semibold tracking-tight text-foreground",
              !isOpen && "md:hidden",
            )}
            onClick={() => setMobileOpen(false)}
          >
            {APP_NAME}
          </Link>
          <Button
            variant="ghost"
            size="icon"
            className="hidden md:inline-flex"
            onClick={toggle}
            aria-label={isOpen ? "جمع کردن نوار کناری" : "باز کردن نوار کناری"}
          >
            {isOpen ? (
              <PanelRightClose className="rtl-flip size-4" aria-hidden />
            ) : (
              <PanelRightOpen className="rtl-flip size-4" aria-hidden />
            )}
          </Button>
        </div>

        <Separator />

        <nav
          className="flex flex-1 flex-col gap-0.5 p-2"
          aria-label="ناوبری اصلی"
        >
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className={cn(
                  "flex items-center gap-2 rounded-md px-2 py-1.5 text-sm text-muted-foreground transition-colors duration-150 hover:bg-interactive hover:text-interactive-foreground",
                  isActive &&
                    "bg-interactive-selected text-interactive-foreground",
                  !isOpen && "md:justify-center md:px-0",
                )}
                title={!isOpen ? item.title : undefined}
              >
                <Icon className="size-4 shrink-0" aria-hidden />
                <span className={cn(!isOpen && "md:hidden")}>{item.title}</span>
              </Link>
            );
          })}
        </nav>
      </aside>
    </>
  );
}
