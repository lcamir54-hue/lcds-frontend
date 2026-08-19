"use client";

import { create } from "zustand";

import { restoreSession } from "@/features/auth/lib/auth-session";
import {
  canCreateInTopic,
  canCreateTopic,
  canWriteDocument,
  getAccessPrincipal,
} from "@/features/documents/lib/access-control";
import { flattenKnowledgeTree } from "@/features/documents/lib/tree";
import type {
  DocumentMeta,
  PublishStatus,
  SaveStatus,
  ViewMode,
} from "@/features/documents/types";
import {
  createPage as createPageRequest,
  createProcess as createProcessRequest,
  createTopic,
  deletePage as deletePageRequest,
  deleteProcess as deleteProcessRequest,
  deleteTopic,
  duplicatePage as duplicatePageRequest,
  duplicateProcess as duplicateProcessRequest,
  duplicateTopic,
  getKnowledgeTree,
  getPage,
  updatePage,
  updateProcess,
  updateTopic,
} from "@/lib/api/knowledge";
import type { TopicTreeNode } from "@/lib/api/types";

type WorkspaceState = {
  topics: TopicTreeNode[];
  items: DocumentMeta[];
  activeId: string | null;
  activeMeta: DocumentMeta | null;
  markdown: string;
  viewMode: ViewMode;
  saveStatus: SaveStatus;
  isDirty: boolean;
  isSaving: boolean;
  sidebarOpen: boolean;
  outlineOpen: boolean;
  mobileNav: "none" | "tree";
  expandedIds: Record<string, boolean>;
  hydrated: boolean;
  bootstrap: () => Promise<void>;
  setActiveDocument: (id: string) => Promise<void>;
  setMarkdown: (markdown: string, options?: { dirty?: boolean }) => void;
  setViewMode: (mode: ViewMode) => void;
  setSaveStatus: (status: SaveStatus) => void;
  setSidebarOpen: (open: boolean) => void;
  setOutlineOpen: (open: boolean) => void;
  setMobileNav: (nav: "none" | "tree") => void;
  toggleExpanded: (id: string) => void;
  refreshDocuments: () => Promise<void>;
  saveActive: () => Promise<void>;
  createPage: (input: {
    title: string;
    icon?: string;
    kind?: "topic" | "page" | "process";
    parentId?: string | null;
    allowedGroupIds?: string[];
  }) => Promise<string>;
  renamePage: (id: string, title: string) => Promise<void>;
  updatePublishStatus: (id: string, status: PublishStatus) => Promise<void>;
  duplicatePage: (id: string) => Promise<string | void>;
  deletePage: (id: string) => Promise<void>;
};

function applyTree(topics: TopicTreeNode[]) {
  return {
    topics,
    items: flattenKnowledgeTree(topics),
  };
}

function topicExpandedMap(topics: TopicTreeNode[]) {
  return Object.fromEntries(topics.map((topic) => [topic.id, true]));
}

function findItem(items: DocumentMeta[], id: string) {
  return items.find((item) => item.id === id);
}

export const useWorkspaceStore = create<WorkspaceState>((set, get) => ({
  topics: [],
  items: [],
  activeId: null,
  activeMeta: null,
  markdown: "",
  viewMode: "edit",
  saveStatus: "idle",
  isDirty: false,
  isSaving: false,
  sidebarOpen: true,
  outlineOpen: false,
  mobileNav: "none",
  expandedIds: {},
  hydrated: false,

  async bootstrap() {
    const session = await restoreSession();
    if (!session) {
      if (typeof window !== "undefined") {
        window.location.replace("/login");
      }
      return;
    }

    try {
      const tree = await getKnowledgeTree();
      const topicExpanded = topicExpandedMap(tree.topics);

      if (get().hydrated) {
        set((state) => ({
          ...applyTree(tree.topics),
          expandedIds: { ...topicExpanded, ...state.expandedIds },
        }));
        return;
      }

      set({
        ...applyTree(tree.topics),
        activeId: null,
        activeMeta: null,
        markdown: "",
        isDirty: false,
        saveStatus: "idle",
        hydrated: true,
        expandedIds: topicExpanded,
      });
    } catch {
      set({
        topics: [],
        items: [],
        hydrated: true,
      });
    }
  },

  async setActiveDocument(id) {
    const { activeId, isDirty, saveActive, items } = get();
    if (activeId === id) return;

    const meta = findItem(items, id);
    if (!meta) return;

    if (meta.kind === "topic") {
      set((state) => ({
        expandedIds: {
          ...state.expandedIds,
          [id]: !state.expandedIds[id],
        },
        mobileNav: "none",
      }));
      return;
    }

    if (isDirty && activeId) {
      const active = findItem(get().items, activeId);
      if (active?.kind === "page") {
        await saveActive();
      }
    }

    if (meta.kind === "process") {
      set((state) => ({
        activeId: id,
        activeMeta: meta,
        markdown: "",
        isDirty: false,
        saveStatus: meta.canWrite ? "idle" : "readonly",
        viewMode: meta.canWrite ? state.viewMode : "read",
        mobileNav: "none",
        expandedIds: meta.parent
          ? { ...state.expandedIds, [meta.parent]: true }
          : state.expandedIds,
      }));
      return;
    }

    try {
      const page = await getPage(id);
      const writable = page.canWrite;
      set((state) => ({
        activeId: id,
        activeMeta: {
          ...meta,
          title: page.title,
          icon: page.icon,
          status: page.status,
          canWrite: page.canWrite,
          updatedAt: page.updatedAt,
        },
        markdown: page.markdown,
        isDirty: false,
        saveStatus: writable ? "saved" : "readonly",
        viewMode: writable ? "edit" : "read",
        mobileNav: "none",
        expandedIds: page.topicId
          ? { ...state.expandedIds, [page.topicId]: true }
          : state.expandedIds,
      }));
    } catch {
      set({ saveStatus: "error" });
    }
  },

  setMarkdown(markdown, options) {
    const dirty = options?.dirty ?? true;
    const { activeMeta } = get();
    if (activeMeta && !canWriteDocument(activeMeta, getAccessPrincipal())) {
      return;
    }
    set({
      markdown,
      isDirty: dirty,
      saveStatus: dirty ? "idle" : get().saveStatus,
    });
  },

  setViewMode(mode) {
    const { activeMeta } = get();
    if (mode === "edit" && activeMeta && !canWriteDocument(activeMeta, getAccessPrincipal())) {
      set({ viewMode: "read", saveStatus: "readonly" });
      return;
    }
    set({ viewMode: mode });
  },

  setSaveStatus(status) {
    set({ saveStatus: status });
  },

  setSidebarOpen(open) {
    set({ sidebarOpen: open });
  },

  setOutlineOpen(open) {
    set({ outlineOpen: open });
  },

  setMobileNav(nav) {
    set({ mobileNav: nav });
  },

  toggleExpanded(id) {
    set((state) => ({
      expandedIds: {
        ...state.expandedIds,
        [id]: !state.expandedIds[id],
      },
    }));
  },

  async refreshDocuments() {
    const tree = await getKnowledgeTree();
    const { activeId, items } = get();
    const next = applyTree(tree.topics);
    const activeMeta = activeId ? findItem(next.items, activeId) ?? null : null;
    set({
      ...next,
      activeMeta: activeMeta ?? findItem(items, activeId ?? "") ?? get().activeMeta,
    });
  },

  async saveActive() {
    const { activeId, markdown, isSaving, activeMeta } = get();
    if (!activeId || isSaving || !activeMeta) return;
    if (activeMeta.kind !== "page") return;
    if (!canWriteDocument(activeMeta, getAccessPrincipal())) {
      set({ isDirty: false, saveStatus: "readonly", viewMode: "read" });
      return;
    }

    set({ isSaving: true, saveStatus: "saving" });
    try {
      const saved = await updatePage(activeId, { markdown });
      await get().refreshDocuments();
      set({
        isDirty: false,
        isSaving: false,
        saveStatus: "saved",
        markdown: saved.markdown,
        activeMeta: {
          ...activeMeta,
          title: saved.title,
          icon: saved.icon,
          status: saved.status,
          canWrite: saved.canWrite,
          updatedAt: saved.updatedAt,
        },
      });
    } catch {
      set({ isSaving: false, saveStatus: "error" });
    }
  },

  async createPage(input) {
    const kind = input.kind ?? (input.parentId ? "page" : "topic");
    const principal = getAccessPrincipal();
    if (!principal?.userId) return "";

    if (kind === "topic") {
      if (!canCreateTopic(principal)) return "";
      if (!input.allowedGroupIds?.length) return "";
      const created = await createTopic({
        title: input.title,
        icon: input.icon,
        allowedGroupIds: input.allowedGroupIds,
      });
      await get().refreshDocuments();
      set((state) => ({
        expandedIds: { ...state.expandedIds, [created.id]: true },
      }));
      return created.id;
    }

    if (!input.parentId) return "";
    const parent = findItem(get().items, input.parentId);
    if (!parent || !canCreateInTopic(parent, principal)) return "";

    if (kind === "process") {
      const created = await createProcessRequest(input.parentId, {
        title: input.title,
        icon: input.icon,
      });
      await get().refreshDocuments();
      set((state) => ({
        expandedIds: { ...state.expandedIds, [input.parentId!]: true },
        activeId: created.id,
        activeMeta: findItem(state.items, created.id) ?? null,
        markdown: "",
        isDirty: false,
        saveStatus: created.canWrite ? "idle" : "readonly",
        mobileNav: "none",
      }));
      return created.id;
    }

    const created = await createPageRequest(input.parentId, {
      title: input.title,
      icon: input.icon,
      markdown: "",
    });
    await get().refreshDocuments();
    set((state) => ({
      expandedIds: { ...state.expandedIds, [input.parentId!]: true },
    }));
    await get().setActiveDocument(created.id);
    return created.id;
  },

  async renamePage(id, title) {
    const item = findItem(get().items, id);
    if (!item || !canWriteDocument(item, getAccessPrincipal())) return;

    if (item.kind === "topic") {
      await updateTopic(id, { title });
    } else if (item.kind === "page") {
      await updatePage(id, { title });
    } else {
      await updateProcess(id, { title });
    }

    await get().refreshDocuments();
    if (get().activeId === id) {
      set((state) => ({
        activeMeta: state.activeMeta
          ? { ...state.activeMeta, title }
          : findItem(state.items, id) ?? null,
      }));
    }
  },

  async updatePublishStatus(id, status: PublishStatus) {
    const item = findItem(get().items, id);
    if (!item || (item.kind !== "page" && item.kind !== "process")) return;
    if (!canWriteDocument(item, getAccessPrincipal())) return;

    if (item.kind === "page") {
      await updatePage(id, { status });
    } else {
      await updateProcess(id, { status });
    }

    await get().refreshDocuments();
    if (get().activeId === id) {
      set((state) => ({
        activeMeta: state.activeMeta
          ? { ...state.activeMeta, status }
          : findItem(state.items, id) ?? null,
      }));
    }
  },

  async duplicatePage(id) {
    const item = findItem(get().items, id);
    const principal = getAccessPrincipal();
    if (!item || !canWriteDocument(item, principal) || !principal?.userId) return;

    if (item.kind === "topic") {
      const created = await duplicateTopic(id);
      await get().refreshDocuments();
      set((state) => ({
        expandedIds: { ...state.expandedIds, [created.id]: true },
      }));
      return created.id;
    }

    if (item.kind === "process") {
      const copy = await duplicateProcessRequest(id);
      await get().refreshDocuments();
      if (item.parent) {
        set((state) => ({
          expandedIds: { ...state.expandedIds, [item.parent!]: true },
          activeId: copy.id,
          markdown: "",
          isDirty: false,
          saveStatus: "idle",
        }));
      }
      return copy.id;
    }

    const created = await duplicatePageRequest(id);
    await get().refreshDocuments();
    await get().setActiveDocument(created.id);
    return created.id;
  },

  async deletePage(id) {
    const item = findItem(get().items, id);
    if (!item || !canWriteDocument(item, getAccessPrincipal())) return;

    if (item.kind === "topic") {
      await deleteTopic(id);
    } else if (item.kind === "page") {
      await deletePageRequest(id);
    } else {
      await deleteProcessRequest(id);
    }

    const tree = await getKnowledgeTree();
    const next = applyTree(tree.topics);
    const activeStillExists = next.items.some((doc) => doc.id === get().activeId);

    set({
      ...next,
    });

    if (activeStillExists) return;

    set({
      activeId: null,
      activeMeta: null,
      markdown: "",
      isDirty: false,
      saveStatus: "idle",
    });
  },
}));
