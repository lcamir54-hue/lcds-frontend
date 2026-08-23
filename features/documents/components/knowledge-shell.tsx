"use client";

import * as React from "react";

import { PageTreeSidebar } from "@/features/documents/components/page-tree-sidebar";
import { UnsavedNavigationProvider } from "@/features/documents/components/unsaved-navigation-provider";
import { WorkspaceHeader } from "@/features/documents/components/workspace-header";
import { useWorkspaceStore } from "@/features/documents/hooks/use-workspace-store";

export function KnowledgeShell({ children }: { children: React.ReactNode }) {
  const bootstrap = useWorkspaceStore((s) => s.bootstrap);
  const hydrated = useWorkspaceStore((s) => s.hydrated);
  const mobileNav = useWorkspaceStore((s) => s.mobileNav);
  const setMobileNav = useWorkspaceStore((s) => s.setMobileNav);

  React.useEffect(() => {
    void bootstrap();
  }, [bootstrap]);

  if (!hydrated) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-background text-sm text-muted-foreground">
        در حال بارگذاری فضای کاری…
      </div>
    );
  }

  return (
    <UnsavedNavigationProvider>
      <div className="flex h-dvh flex-col overflow-hidden bg-background">
        <WorkspaceHeader />
        <div className="relative flex min-h-0 flex-1 overflow-hidden">
          <div className="hidden md:flex">
            <PageTreeSidebar />
          </div>
          <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
            {children}
          </div>
          {mobileNav === "tree" ? (
            <div className="absolute inset-0 z-40 flex md:hidden">
              <button
                type="button"
                className="absolute inset-0 bg-overlay"
                aria-label="بستن پنل"
                onClick={() => setMobileNav("none")}
              />
              <div className="relative z-10 ms-auto flex h-full">
                <PageTreeSidebar className="h-full shadow-none" />
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </UnsavedNavigationProvider>
  );
}
