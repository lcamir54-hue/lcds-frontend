"use client";

import * as React from "react";

import { ChatPanel } from "@/features/chat/components/chat-panel";
import { useChatStore } from "@/features/chat/hooks/use-chat-store";
import { PageTreeSidebar } from "@/features/documents/components/page-tree-sidebar";
import { WorkspaceHeader } from "@/features/documents/components/workspace-header";
import { useWorkspaceStore } from "@/features/documents/hooks/use-workspace-store";

export function KnowledgeShell({ children }: { children: React.ReactNode }) {
  const bootstrap = useWorkspaceStore((s) => s.bootstrap);
  const hydrated = useWorkspaceStore((s) => s.hydrated);
  const mobileNav = useWorkspaceStore((s) => s.mobileNav);
  const setMobileNav = useWorkspaceStore((s) => s.setMobileNav);
  const chatOpen = useChatStore((s) => s.open);

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
    <div className="flex h-dvh flex-col overflow-hidden bg-background">
      <WorkspaceHeader />
      <div className="relative flex min-h-0 flex-1 overflow-hidden">
        <div className="hidden md:flex">
          <PageTreeSidebar />
        </div>
        <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
          {children}
        </div>
        {chatOpen ? (
          <div className="hidden h-full lg:flex">
            <ChatPanel />
          </div>
        ) : null}
        {chatOpen ? (
          <div className="absolute inset-0 z-40 flex lg:hidden">
            <button
              type="button"
              className="absolute inset-0 bg-overlay"
              aria-label="بستن گفتگو"
              onClick={() => useChatStore.getState().setOpen(false)}
            />
            <div className="relative z-10 ms-auto flex h-full">
              <ChatPanel />
            </div>
          </div>
        ) : null}
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
  );
}
