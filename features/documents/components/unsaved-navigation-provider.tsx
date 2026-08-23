"use client";

import { usePathname, useRouter } from "next/navigation";
import * as React from "react";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { buttonVariants } from "@/components/ui/button";
import { useWorkspaceStore } from "@/features/documents/hooks/use-workspace-store";
import {
  discardUnsavedChanges,
  hasUnsavedChanges,
  saveUnsavedChanges,
} from "@/features/documents/lib/unsaved-changes";
import { useProcessStore } from "@/features/processes/hooks/use-process-store";
import { cn } from "@/lib/utils";

type LeaveAction = { type: "href"; href: string } | { type: "run"; run: () => void };

type UnsavedNavigationContextValue = {
  requestLeave: (next: string | (() => void)) => void;
};

const UnsavedNavigationContext =
  React.createContext<UnsavedNavigationContextValue | null>(null);

export function useUnsavedNavigation() {
  const context = React.useContext(UnsavedNavigationContext);
  const router = useRouter();
  if (context) return context;
  return {
    requestLeave: (next: string | (() => void)) => {
      if (typeof next === "string") {
        router.push(next);
        return;
      }
      next();
    },
  };
}

function toAction(next: string | (() => void)): LeaveAction {
  return typeof next === "string" ? { type: "href", href: next } : { type: "run", run: next };
}

function isInternalHref(href: string) {
  return href.startsWith("/") && !href.startsWith("//");
}

export function UnsavedNavigationProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const pageDirty = useWorkspaceStore((s) => s.isDirty);
  const processDirty = useProcessStore((s) => s.isDirty);
  const dirty = pageDirty || processDirty;
  const [pending, setPending] = React.useState<LeaveAction | null>(null);
  const [saving, setSaving] = React.useState(false);

  const runAction = React.useCallback(
    (action: LeaveAction) => {
      if (action.type === "href") {
        if (action.href === pathname) return;
        router.push(action.href);
        return;
      }
      action.run();
    },
    [pathname, router],
  );

  const requestLeave = React.useCallback(
    (next: string | (() => void)) => {
      const action = toAction(next);
      if (!hasUnsavedChanges()) {
        runAction(action);
        return;
      }
      setPending(action);
    },
    [runAction],
  );

  const stay = React.useCallback(() => {
    if (saving) return;
    setPending(null);
  }, [saving]);

  const leaveWithoutSaving = React.useCallback(() => {
    if (saving || !pending) return;
    discardUnsavedChanges();
    const action = pending;
    setPending(null);
    runAction(action);
  }, [pending, runAction, saving]);

  const saveAndLeave = React.useCallback(async () => {
    if (saving || !pending) return;
    setSaving(true);
    const saved = await saveUnsavedChanges();
    setSaving(false);
    if (!saved) return;
    const action = pending;
    setPending(null);
    runAction(action);
  }, [pending, runAction, saving]);

  React.useEffect(() => {
    const onBeforeUnload = (event: BeforeUnloadEvent) => {
      if (!hasUnsavedChanges()) return;
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [dirty]);

  React.useEffect(() => {
    const onClick = (event: MouseEvent) => {
      if (event.defaultPrevented || event.button !== 0) return;
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      if (!hasUnsavedChanges()) return;

      const target = event.target;
      if (!(target instanceof Element)) return;
      const anchor = target.closest("a");
      if (!anchor) return;
      if (anchor.target && anchor.target !== "_self") return;
      if (anchor.hasAttribute("download")) return;

      const href = anchor.getAttribute("href");
      if (!href || href.startsWith("#") || href.startsWith("mailto:")) return;
      if (!isInternalHref(href)) return;
      const [path] = href.split("?");
      if (path === pathname) return;

      event.preventDefault();
      event.stopPropagation();
      setPending({ type: "href", href });
    };

    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, [pathname]);

  const value = React.useMemo(() => ({ requestLeave }), [requestLeave]);

  return (
    <UnsavedNavigationContext.Provider value={value}>
      {children}
      <AlertDialog
        open={pending !== null}
        onOpenChange={(open) => {
          if (!open) stay();
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>تغییرات ذخیره نشده‌اند</AlertDialogTitle>
            <AlertDialogDescription>
              اگر بدون ذخیره از این صفحه خارج شوید، محتوایی که ساخته‌اید از بین
              می‌رود.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={saving}>ماندن در صفحه</AlertDialogCancel>
            <button
              type="button"
              className={cn(buttonVariants({ variant: "outline" }))}
              disabled={saving}
              onClick={leaveWithoutSaving}
            >
              خروج بدون ذخیره
            </button>
            <AlertDialogAction
              disabled={saving}
              onClick={(event) => {
                event.preventDefault();
                void saveAndLeave();
              }}
            >
              {saving ? "در حال ذخیره…" : "ذخیره و ادامه"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </UnsavedNavigationContext.Provider>
  );
}
