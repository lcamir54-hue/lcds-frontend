"use client";

import { BookOpen, ChevronDown, Menu, Sparkles } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import * as React from "react";

import { ThemeToggle } from "@/components/shared/theme-toggle";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAssistantStore } from "@/features/assistant/hooks/use-assistant-store";
import { getSessionUser, logout } from "@/features/auth/lib/auth-session";
import { APP_NAME, type AuthUser } from "@/lib/constants";

function userInitial(fullName: string) {
  return fullName.trim().charAt(0) || "ک";
}

function subscribeToSession(onStoreChange: () => void) {
  if (typeof window === "undefined") return () => undefined;
  window.addEventListener("lcds-auth-change", onStoreChange);
  window.addEventListener("storage", onStoreChange);
  return () => {
    window.removeEventListener("lcds-auth-change", onStoreChange);
    window.removeEventListener("storage", onStoreChange);
  };
}

function getSessionSnapshot(): AuthUser | null {
  return getSessionUser();
}

function getServerSessionSnapshot(): AuthUser | null {
  return null;
}

export function AssistantShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const bootstrap = useAssistantStore((state) => state.bootstrap);
  const setMemoryOpen = useAssistantStore((state) => state.setMemoryOpen);
  const user = React.useSyncExternalStore(
    subscribeToSession,
    getSessionSnapshot,
    getServerSessionSnapshot,
  );
  const isAdminUser = user?.role === "admin";
  const displayName = user?.fullName ?? "کاربر";

  React.useEffect(() => {
    bootstrap();
  }, [bootstrap]);

  return (
    <div className="flex h-dvh flex-col overflow-hidden bg-background">
      <header className="flex h-12 shrink-0 items-center justify-between gap-3 border-b border-border bg-background px-3 md:px-4">
        <div className="flex min-w-0 items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            className="md:hidden"
            onClick={() => setMemoryOpen(true)}
            aria-label="باز کردن حافظهٔ گفتگو"
          >
            <Menu className="size-4" aria-hidden />
            حافظه
          </Button>
          <div className="flex min-w-0 items-center gap-2">
            <span className="flex size-7 items-center justify-center rounded-md bg-interactive-selected text-interactive-foreground">
              <Sparkles className="size-3.5" aria-hidden />
            </span>
            <div className="min-w-0 leading-tight">
              <p className="truncate text-sm font-semibold tracking-tight">
                {APP_NAME}
              </p>
              <p className="truncate text-xs text-muted-foreground">
                دستیار دانش سازمانی
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/knowledge">
              <BookOpen className="size-4" aria-hidden />
              <span className="hidden sm:inline">دانش سازمانی</span>
            </Link>
          </Button>
          <ThemeToggle />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="gap-2 px-1.5">
                <Avatar className="size-6">
                  <AvatarFallback>{userInitial(displayName)}</AvatarFallback>
                </Avatar>
                <span className="hidden max-w-40 truncate text-sm md:inline">
                  {displayName}
                </span>
                <ChevronDown className="size-3.5 opacity-60" aria-hidden />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              <DropdownMenuItem>پروفایل</DropdownMenuItem>
              {isAdminUser ? (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => router.push("/admin/dashboard")}
                  >
                    داشبورد
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => router.push("/admin/groups")}>
                    مدیریت گروه‌ها
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => router.push("/admin/users")}>
                    مدیریت کاربران
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                </>
              ) : null}
              <DropdownMenuItem
                onClick={() => {
                  void (async () => {
                    await logout();
                    router.replace("/login");
                    router.refresh();
                  })();
                }}
              >
                خروج
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>
      <div className="flex min-h-0 flex-1 overflow-hidden">{children}</div>
    </div>
  );
}
