"use client";

import { ChevronDown, Sparkles } from "lucide-react";
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
import {
  getSessionUser,
  logout,
} from "@/features/auth/lib/auth-session";
import { useUnsavedNavigation } from "@/features/documents/components/unsaved-navigation-provider";
import { useWorkspaceStore } from "@/features/documents/hooks/use-workspace-store";
import {
  APP_NAME,
  APP_TITLE_FA,
  ASSISTANT_PATH,
  type AuthUser,
} from "@/lib/constants";

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

export function WorkspaceHeader() {
  const router = useRouter();
  const { requestLeave } = useUnsavedNavigation();
  const setMobileNav = useWorkspaceStore((s) => s.setMobileNav);
  const user = React.useSyncExternalStore(
    subscribeToSession,
    getSessionSnapshot,
    getServerSessionSnapshot,
  );

  const isAdminUser = user?.role === "admin";
  const displayName = user?.fullName ?? "کاربر";

  return (
    <header className="flex h-12 shrink-0 items-center justify-between gap-3 border-b border-border bg-background px-3 md:px-4">
      <div className="flex min-w-0 items-center gap-2">
        <Button
          variant="ghost"
          size="sm"
          className="md:hidden"
          onClick={() => setMobileNav("tree")}
          aria-label="باز کردن فهرست دانش‌ها"
        >
          منو
        </Button>
        <div className="flex min-w-0 items-baseline gap-2">
          <span className="text-sm font-semibold tracking-tight">{APP_NAME}</span>
          <span className="truncate text-sm text-muted-foreground">
            {APP_TITLE_FA}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => requestLeave(ASSISTANT_PATH)}
        >
          <Sparkles className="size-4" aria-hidden />
          <span className="hidden sm:inline">دستیار دانش</span>
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
                  onClick={() => requestLeave("/admin/dashboard")}
                >
                  داشبورد
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => requestLeave("/admin/groups")}>
                  مدیریت گروه‌ها
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => requestLeave("/admin/users")}>
                  مدیریت کاربران
                </DropdownMenuItem>
                <DropdownMenuSeparator />
              </>
            ) : null}
            <DropdownMenuItem
              onClick={() => {
                requestLeave(() => {
                  void (async () => {
                    await logout();
                    router.replace("/login");
                    router.refresh();
                  })();
                });
              }}
            >
              خروج
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
