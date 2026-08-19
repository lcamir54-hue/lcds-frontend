"use client";

import { Menu } from "lucide-react";

import { ThemeToggle } from "@/components/shared/theme-toggle";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useSidebarStore } from "@/hooks/use-sidebar-store";

export function AppHeader() {
  const { toggleMobile } = useSidebarStore();

  return (
    <header className="sticky top-0 z-30 flex h-[var(--header-height)] items-center justify-between gap-3 border-b border-border bg-background px-4">
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden"
          onClick={toggleMobile}
          aria-label="باز کردن منو"
        >
          <Menu className="size-4" aria-hidden />
        </Button>
        <p className="text-sm text-muted-foreground">فضای کاری سازمان</p>
      </div>

      <div className="flex items-center gap-1">
        <ThemeToggle />
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" aria-label="منوی کاربر">
              کاربر نمونه
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            <DropdownMenuLabel>حساب کاربری</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem>پروفایل</DropdownMenuItem>
            <DropdownMenuItem>ترجیحات</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
