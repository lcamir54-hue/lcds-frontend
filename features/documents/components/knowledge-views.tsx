"use client";

import { FileText } from "lucide-react";
import dynamic from "next/dynamic";
import { useParams, useRouter } from "next/navigation";
import * as React from "react";

import { EmptyState } from "@/components/shared/empty-state";
import { DocumentOutline } from "@/features/documents/components/document-outline";
import { DocumentToolbar } from "@/features/documents/components/document-toolbar";
import { MarkdownEditor } from "@/features/documents/components/markdown-editor";
import { MarkdownRenderer } from "@/features/documents/components/markdown-renderer";
import { PageTokenLimitBanner } from "@/features/documents/components/page-token-meter";
import { useAccessPrincipal } from "@/features/documents/hooks/use-access-principal";
import { useWorkspaceStore } from "@/features/documents/hooks/use-workspace-store";
import { canWriteDocument } from "@/features/documents/lib/access-control";
import { getMarkdownBody } from "@/features/documents/lib/frontmatter";
import { discardUnsavedChanges } from "@/features/documents/lib/unsaved-changes";

const ProcessDesigner = dynamic(
  () =>
    import("@/features/processes/components/ProcessDesigner").then(
      (mod) => mod.ProcessDesigner,
    ),
  {
    ssr: false,
    loading: () => (
      <div className="flex flex-1 items-center justify-center text-sm text-muted-foreground">
        در حال بارگذاری طراح فرآیند…
      </div>
    ),
  },
);

export function PageWorkspace() {
  const params = useParams<{ topicId: string; pageId: string }>();
  const pageId = params.pageId;
  const hydrated = useWorkspaceStore((s) => s.hydrated);
  const items = useWorkspaceStore((s) => s.items);
  const activeId = useWorkspaceStore((s) => s.activeId);
  const markdown = useWorkspaceStore((s) => s.markdown);
  const viewMode = useWorkspaceStore((s) => s.viewMode);
  const outlineOpen = useWorkspaceStore((s) => s.outlineOpen);
  const setActiveDocument = useWorkspaceStore((s) => s.setActiveDocument);
  const setOutlineOpen = useWorkspaceStore((s) => s.setOutlineOpen);
  const setMarkdown = useWorkspaceStore((s) => s.setMarkdown);
  const principal = useAccessPrincipal();

  React.useEffect(() => {
    if (!hydrated || !pageId) return;
    if (activeId === pageId) return;
    void setActiveDocument(pageId);
  }, [activeId, hydrated, pageId, setActiveDocument]);

  const meta = React.useMemo(
    () => items.find((item) => item.id === pageId) ?? null,
    [items, pageId],
  );

  if (!meta || meta.kind !== "page") {
    return (
      <EmptyState
        icon={<FileText />}
        title="صفحه یافت نشد"
        description="این صفحه در درخت دانش وجود ندارد."
        className="h-full"
      />
    );
  }

  const canWrite = canWriteDocument(meta, principal);
  const showEditor = canWrite && activeId === pageId && viewMode === "edit";

  return (
    <div className="flex min-h-0 flex-1 overflow-hidden">
      <main className="relative flex min-w-0 flex-1 flex-col overflow-hidden">
        <DocumentToolbar />
        {!showEditor ? (
          <PageTokenLimitBanner content={getMarkdownBody(markdown)} />
        ) : null}
        <div className="relative min-h-0 flex-1 overflow-hidden">
          {showEditor ? (
            <MarkdownEditor
              documentId={pageId}
              markdown={markdown}
              onChange={(value) => setMarkdown(value)}
            />
          ) : (
            <div className="h-full overflow-y-auto">
              <MarkdownRenderer markdown={markdown} />
            </div>
          )}
        </div>
      </main>
      {outlineOpen ? (
        <div className="hidden h-full lg:flex">
          <DocumentOutline />
        </div>
      ) : null}
      {outlineOpen ? (
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
    </div>
  );
}

export function ProcessWorkspace() {
  const params = useParams<{ topicId: string; processId: string }>();
  const router = useRouter();
  const items = useWorkspaceStore((s) => s.items);
  const refreshDocuments = useWorkspaceStore((s) => s.refreshDocuments);
  const principal = useAccessPrincipal();

  const processId = params.processId;
  const topicId = params.topicId;
  const hydrated = useWorkspaceStore((s) => s.hydrated);
  const activeId = useWorkspaceStore((s) => s.activeId);

  const topicMeta = items.find((item) => item.id === topicId);
  const processMeta = items.find((item) => item.id === processId) ?? null;

  React.useEffect(() => {
    if (!hydrated || !processId) return;
    if (activeId === processId) return;
    useWorkspaceStore.setState((state) => ({
      activeId: processId,
      activeMeta: processMeta,
      expandedIds: { ...state.expandedIds, [topicId]: true },
      mobileNav: "none",
      markdown: "",
      isDirty: false,
    }));
  }, [activeId, hydrated, processId, processMeta, topicId]);

  if (!processMeta || processMeta.kind !== "process") {
    return (
      <EmptyState
        icon={<FileText />}
        title="فرآیند یافت نشد"
        description="این فرآیند در درخت دانش وجود ندارد."
        className="h-full"
      />
    );
  }

  const canWrite = canWriteDocument(processMeta, principal);

  return (
    <ProcessDesigner
      processId={processId}
      topicId={topicId}
      topicTitle={topicMeta?.title ?? "عنوان"}
      processTitle={processMeta.title}
      processIcon={processMeta.icon}
      readOnly={!canWrite}
      onTitleChange={(title) => {
        void useWorkspaceStore.getState().renamePage(processId, title);
      }}
      onStatusChange={(status) => {
        void useWorkspaceStore.getState().updatePublishStatus(processId, status);
      }}
      onDeleted={async () => {
        discardUnsavedChanges();
        await refreshDocuments();
        router.push("/knowledge");
      }}
      onDuplicated={async (newProcessId) => {
        await refreshDocuments();
        router.push(`/knowledge/${topicId}/process/${newProcessId}`);
      }}
    />
  );
}

export function KnowledgeHome() {
  return (
    <EmptyState
      icon={<FileText />}
      title="صفحه‌ای انتخاب نشده است"
      description="یک عنوان را باز کنید و صفحه یا فرآیندی را از زیرمجموعه‌اش انتخاب کنید."
      className="h-full"
    />
  );
}
