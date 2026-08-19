"use client";

import { FileText } from "lucide-react";
import * as React from "react";

import { EmptyState } from "@/components/shared/empty-state";
import { DocumentOutline } from "@/features/documents/components/document-outline";
import { DocumentToolbar } from "@/features/documents/components/document-toolbar";
import { MarkdownEditor } from "@/features/documents/components/markdown-editor";
import { MarkdownRenderer } from "@/features/documents/components/markdown-renderer";
import { PageTreeSidebar } from "@/features/documents/components/page-tree-sidebar";
import { WorkspaceHeader } from "@/features/documents/components/workspace-header";
import {
  useAutosave,
  useUnsavedChangesWarning,
} from "@/features/documents/hooks/use-autosave";
import { useWorkspaceStore } from "@/features/documents/hooks/use-workspace-store";

export function DocumentWorkspace() {
  const bootstrap = useWorkspaceStore((s) => s.bootstrap);
  const hydrated = useWorkspaceStore((s) => s.hydrated);
  const activeId = useWorkspaceStore((s) => s.activeId);
  const activeMeta = useWorkspaceStore((s) => s.activeMeta);
  const markdown = useWorkspaceStore((s) => s.markdown);
  const viewMode = useWorkspaceStore((s) => s.viewMode);
  const outlineOpen = useWorkspaceStore((s) => s.outlineOpen);
  const mobileNav = useWorkspaceStore((s) => s.mobileNav);
  const setMobileNav = useWorkspaceStore((s) => s.setMobileNav);
  const setOutlineOpen = useWorkspaceStore((s) => s.setOutlineOpen);
  const setMarkdown = useWorkspaceStore((s) => s.setMarkdown);

  useAutosave(800);
  useUnsavedChangesWarning();

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

        <main className="relative flex min-w-0 flex-1 flex-col overflow-hidden">
          {activeMeta && activeId ? (
            <>
              <DocumentToolbar />
              <div className="relative min-h-0 flex-1 overflow-y-auto">
                {viewMode === "edit" ? (
                  <MarkdownEditor
                    documentId={activeId}
                    markdown={markdown}
                    onChange={(value) => setMarkdown(value)}
                  />
                ) : null}
                {viewMode === "read" ? (
                  <MarkdownRenderer markdown={markdown} />
                ) : null}
              </div>
            </>
          ) : (
            <EmptyState
              icon={<FileText />}
              title="صفحه‌ای انتخاب نشده است"
              description="یک عنوان را باز کنید و صفحه یا فرآیندی را از زیرمجموعه‌اش انتخاب کنید."
              className="h-full"
            />
          )}
        </main>

        {outlineOpen && activeMeta ? (
          <div className="hidden h-full lg:flex">
            <DocumentOutline />
          </div>
        ) : null}

        {outlineOpen && activeMeta ? (
          <div className="absolute inset-0 z-40 flex lg:hidden">
            <button
              type="button"
              className="absolute inset-0 bg-overlay"
              aria-label="بستن فهرست مطالب"
              onClick={() => setOutlineOpen(false)}
            />
            <div className="relative z-10 me-auto flex h-full">
              <DocumentOutline />
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
