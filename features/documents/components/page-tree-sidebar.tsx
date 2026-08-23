"use client";

import {
  ChevronDown,
  ChevronLeft,
  Copy,
  FilePlus,
  Folder,
  MoreHorizontal,
  PanelRightClose,
  Pencil,
  Plus,
  Trash2,
  Workflow,
} from "lucide-react";
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
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  CreateChildDialog,
  type CreateChildKind,
} from "@/features/documents/components/create-child-dialog";
import { CreateTopicDialog } from "@/features/documents/components/create-topic-dialog";
import { useUnsavedNavigation } from "@/features/documents/components/unsaved-navigation-provider";
import { useAccessPrincipal } from "@/features/documents/hooks/use-access-principal";
import { useWorkspaceStore } from "@/features/documents/hooks/use-workspace-store";
import {
  canCreateInTopic,
  canCreateTopic,
  canWriteDocument,
} from "@/features/documents/lib/access-control";
import { defaultIconForKind } from "@/features/documents/lib/frontmatter";
import { knowledgeItemHref } from "@/features/documents/lib/knowledge-routes";
import type { DocumentKind, DocumentMeta } from "@/features/documents/types";
import { PUBLISH_STATUS_LABELS } from "@/features/documents/types";
import { APP_TITLE_FA } from "@/lib/constants";
import { cn } from "@/lib/utils";

type TreeNode = DocumentMeta & { children: TreeNode[] };

function buildTree(metas: DocumentMeta[]): TreeNode[] {
  const map = new Map<string, TreeNode>();
  for (const meta of metas) {
    map.set(meta.id, { ...meta, children: [] });
  }

  const roots: TreeNode[] = [];
  for (const node of map.values()) {
    if (node.parent && map.has(node.parent)) {
      map.get(node.parent)!.children.push(node);
    } else {
      roots.push(node);
    }
  }

  const sortRecursive = (nodes: TreeNode[]) => {
    nodes.sort((a, b) => a.order - b.order);
    nodes.forEach((child) => sortRecursive(child.children));
  };
  sortRecursive(roots);
  return roots;
}

function kindLabel(kind: DocumentKind) {
  if (kind === "topic") return "عنوان";
  if (kind === "process") return "فرآیند";
  return "صفحه";
}

function containsActive(node: TreeNode, activeId: string | null): boolean {
  if (!activeId) return false;
  if (node.id === activeId) return true;
  return node.children.some((child) => containsActive(child, activeId));
}

function PageTreeItem({
  node,
  depth,
}: {
  node: TreeNode;
  depth: number;
}) {
  const { requestLeave } = useUnsavedNavigation();
  const activeId = useWorkspaceStore((s) => s.activeId);
  const expandedIds = useWorkspaceStore((s) => s.expandedIds);
  const toggleExpanded = useWorkspaceStore((s) => s.toggleExpanded);
  const createPage = useWorkspaceStore((s) => s.createPage);
  const renamePage = useWorkspaceStore((s) => s.renamePage);
  const duplicatePage = useWorkspaceStore((s) => s.duplicatePage);
  const deletePage = useWorkspaceStore((s) => s.deletePage);
  const setMobileNav = useWorkspaceStore((s) => s.setMobileNav);
  const principal = useAccessPrincipal();

  const [renaming, setRenaming] = React.useState(false);
  const [title, setTitle] = React.useState(node.title);
  const [confirmDelete, setConfirmDelete] = React.useState(false);
  const [childDialog, setChildDialog] = React.useState<{
    kind: CreateChildKind;
  } | null>(null);

  const hasChildren = node.children.length > 0;
  const expanded = Boolean(expandedIds[node.id]);
  const isTopic = node.kind === "topic";
  const isActiveDocument = !isTopic && activeId === node.id;
  const isActiveFolder = isTopic && containsActive(node, activeId);
  const canWrite = canWriteDocument(node, principal);
  const canAddChild = isTopic && canCreateInTopic(node, principal);

  return (
    <div>
      <div
        className={cn(
          "group flex items-center gap-0.5 rounded-md pe-1 transition-colors duration-150 hover:bg-interactive hover:text-interactive-foreground",
          (isActiveDocument || isActiveFolder) &&
            "bg-interactive-selected text-interactive-foreground",
        )}
        style={{ paddingInlineStart: `${depth * 12 + 4}px` }}
      >
        <button
          type="button"
          className={cn(
            "flex size-6 items-center justify-center rounded-sm text-muted-foreground",
            !isTopic && !hasChildren && "invisible",
          )}
          aria-label={expanded ? "جمع کردن" : "باز کردن"}
          onClick={() => {
            if (isTopic || hasChildren) toggleExpanded(node.id);
          }}
        >
          {expanded ? (
            <ChevronDown className="size-3.5" aria-hidden />
          ) : (
            <ChevronLeft className="size-3.5 rtl:rotate-180" aria-hidden />
          )}
        </button>

        {renaming ? (
          <Input
            value={title}
            autoFocus
            className="h-7 flex-1"
            onChange={(event) => setTitle(event.target.value)}
            onBlur={() => {
              setRenaming(false);
              if (title.trim() && title !== node.title) {
                void renamePage(node.id, title.trim());
              }
            }}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                (event.target as HTMLInputElement).blur();
              }
              if (event.key === "Escape") {
                setTitle(node.title);
                setRenaming(false);
              }
            }}
          />
        ) : (
          <button
            type="button"
            className="flex min-w-0 flex-1 items-center gap-1.5 truncate px-1 py-1.5 text-start text-sm"
            onClick={() => {
              if (isTopic) {
                toggleExpanded(node.id);
                return;
              }
              const href = knowledgeItemHref(node);
              if (href) {
                setMobileNav("none");
                requestLeave(href);
              }
            }}
          >
            {isTopic ? (
              <Folder className="size-3.5 shrink-0 text-muted-foreground" aria-hidden />
            ) : (
              <span aria-hidden>{node.icon}</span>
            )}
            <span className="truncate">{node.title}</span>
            {!isTopic ? (
              <span
                className={cn(
                  "ms-auto shrink-0 rounded-sm px-1 py-0.5 text-[10px]",
                  node.status === "published"
                    ? "bg-success-muted text-success-muted-foreground"
                    : "bg-muted text-muted-foreground",
                )}
              >
                {PUBLISH_STATUS_LABELS[node.status ?? "draft"]}
              </span>
            ) : null}
          </button>
        )}

        <div className="flex opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100">
          {canAddChild ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-6"
                  aria-label="افزودن زیرمجموعه"
                >
                  <Plus className="size-3.5" aria-hidden />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start">
                <DropdownMenuItem onClick={() => setChildDialog({ kind: "page" })}>
                  <FilePlus className="size-4" aria-hidden />
                  صفحه جدید
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => setChildDialog({ kind: "process" })}
                >
                  <Workflow className="size-4" aria-hidden />
                  فرآیند
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : null}

          {canWrite ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="size-6"
                aria-label="گزینه‌ها"
              >
                <MoreHorizontal className="size-3.5" aria-hidden />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              <DropdownMenuItem
                onClick={() => {
                  setTitle(node.title);
                  setRenaming(true);
                }}
              >
                <Pencil className="size-4" aria-hidden />
                تغییر نام
              </DropdownMenuItem>
              {!isTopic ? (
                <DropdownMenuItem
                  onClick={() => {
                    void (async () => {
                      const newId = await duplicatePage(node.id);
                      if (!newId || !node.parent) return;
                      const href = knowledgeItemHref({
                        id: newId,
                        kind: node.kind,
                        parent: node.parent,
                      });
                      if (href) requestLeave(href);
                    })();
                  }}
                >
                  <Copy className="size-4" aria-hidden />
                  ایجاد رونوشت
                </DropdownMenuItem>
              ) : (
                <DropdownMenuItem
                  onClick={() => {
                    void duplicatePage(node.id);
                  }}
                >
                  <Copy className="size-4" aria-hidden />
                  ایجاد رونوشت
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-destructive focus:bg-destructive/10 focus:text-destructive"
                onClick={() => setConfirmDelete(true)}
              >
                <Trash2 className="size-4" aria-hidden />
                حذف
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          ) : null}
        </div>
      </div>

      {isTopic && expanded
        ? node.children.map((child) => (
            <PageTreeItem key={child.id} node={child} depth={depth + 1} />
          ))
        : null}

      <CreateChildDialog
        open={childDialog !== null}
        kind={childDialog?.kind ?? "page"}
        topicTitle={node.title}
        onOpenChange={(open) => {
          if (!open) setChildDialog(null);
        }}
        onSubmit={async ({ title: childTitle, icon }) => {
          const kind = childDialog?.kind ?? "page";
          const createdId = await createPage({
            title: childTitle,
            kind,
            icon: icon || defaultIconForKind(kind),
            parentId: node.id,
          });
          const href = knowledgeItemHref({
            id: createdId,
            kind,
            parent: node.id,
          });
          if (href) requestLeave(href);
        }}
      />

      <AlertDialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>حذف {kindLabel(node.kind)}؟</AlertDialogTitle>
            <AlertDialogDescription>
              «{node.title}»
              {isTopic ? " و تمام صفحات و فرآیندهای زیرمجموعهٔ آن" : ""} حذف
              می‌شود. این عمل قابل بازگشت نیست.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>انصراف</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                void (async () => {
                  await deletePage(node.id);
                  if (activeId === node.id || containsActive(node, activeId)) {
                    requestLeave("/knowledge");
                  }
                })();
              }}
            >
              حذف
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

export function PageTreeSidebar({ className }: { className?: string }) {
  const items = useWorkspaceStore((s) => s.items);
  const sidebarOpen = useWorkspaceStore((s) => s.sidebarOpen);
  const setSidebarOpen = useWorkspaceStore((s) => s.setSidebarOpen);
  const createPage = useWorkspaceStore((s) => s.createPage);
  const setMobileNav = useWorkspaceStore((s) => s.setMobileNav);
  const principal = useAccessPrincipal();
  const [topicDialogOpen, setTopicDialogOpen] = React.useState(false);

  const tree = buildTree(items);
  const allowCreateTopic = canCreateTopic(principal);

  if (!sidebarOpen) {
    return (
      <div className="hidden w-10 shrink-0 border-e border-border bg-background lg:flex lg:flex-col">
        <Button
          variant="ghost"
          size="icon"
          className="m-1"
          aria-label="باز کردن نوار کناری"
          onClick={() => setSidebarOpen(true)}
        >
          <PanelRightClose className="size-4 rotate-180" aria-hidden />
        </Button>
      </div>
    );
  }

  return (
    <aside
      className={cn(
        "flex h-full w-[280px] shrink-0 flex-col border-e border-border bg-background",
        className,
      )}
    >
      <div className="flex items-center justify-between gap-2 border-b border-border px-3 py-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-medium">{APP_TITLE_FA}</p>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="hidden lg:inline-flex"
          aria-label="جمع کردن نوار کناری"
          onClick={() => setSidebarOpen(false)}
        >
          <PanelRightClose className="size-4" aria-hidden />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="lg:hidden"
          onClick={() => setMobileNav("none")}
        >
          بستن
        </Button>
      </div>

      {allowCreateTopic ? (
        <div className="px-2 py-2">
          <Button
            size="sm"
            className="w-full justify-start gap-2"
            onClick={() => setTopicDialogOpen(true)}
          >
            <FilePlus className="size-4" aria-hidden />
            عنوان جدید
          </Button>
        </div>
      ) : null}

      <div className="px-3 pb-1 text-xs font-medium text-muted-foreground">
        دانش‌ها
      </div>

      <ScrollArea className="flex-1 px-1 pb-3">
        {tree.map((node) => (
          <PageTreeItem key={node.id} node={node} depth={0} />
        ))}
      </ScrollArea>

      {allowCreateTopic ? (
        <CreateTopicDialog
          open={topicDialogOpen}
          onOpenChange={setTopicDialogOpen}
          onSubmit={async ({ title, allowedGroupIds }) => {
            await createPage({
              title,
              kind: "topic",
              parentId: null,
              allowedGroupIds,
            });
          }}
        />
      ) : null}
    </aside>
  );
}
