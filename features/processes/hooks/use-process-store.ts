"use client";

import { create } from "zustand";

import { validateProcess } from "@/features/processes/lib/process-validation";
import { apiProcessRepository } from "@/features/processes/repositories/api-process-repository";
import type {
  ProcessDocument,
  ProcessSaveStatus,
  ProcessValidationIssue,
  ProcessViewMode,
} from "@/features/processes/types/process.types";

type HistoryEntry = ProcessDocument;

type ProcessStore = {
  process: ProcessDocument | null;
  saveStatus: ProcessSaveStatus;
  viewMode: ProcessViewMode;
  isDirty: boolean;
  isSaving: boolean;
  validationOpen: boolean;
  issues: ProcessValidationIssue[];
  past: HistoryEntry[];
  future: HistoryEntry[];
  selectedNodeIds: string[];
  selectedEdgeIds: string[];
  load: (
    id: string,
    options?: { topicId?: string; title?: string; icon?: string; readOnly?: boolean },
  ) => Promise<void>;
  setProcess: (
    process: ProcessDocument,
    options?: { recordHistory?: boolean; dirty?: boolean },
  ) => void;
  setViewMode: (mode: ProcessViewMode) => void;
  setSelection: (nodeIds: string[], edgeIds: string[]) => void;
  undo: () => void;
  redo: () => void;
  save: () => Promise<void>;
  validate: () => ProcessValidationIssue[];
  setValidationOpen: (open: boolean) => void;
  reset: () => void;
};

function cloneProcess(process: ProcessDocument): ProcessDocument {
  return structuredClone(process);
}

export const useProcessStore = create<ProcessStore>((set, get) => ({
  process: null,
  saveStatus: "idle",
  viewMode: "design",
  isDirty: false,
  isSaving: false,
  validationOpen: false,
  issues: [],
  past: [],
  future: [],
  selectedNodeIds: [],
  selectedEdgeIds: [],

  async load(id, options) {
    try {
      const process = await apiProcessRepository.getProcess(id);
      set({
        process,
        isDirty: false,
        saveStatus: "saved",
        past: [],
        future: [],
        selectedNodeIds: [],
        selectedEdgeIds: [],
        issues: validateProcess(process),
        viewMode: options?.readOnly || process.canWrite === false ? "view" : "design",
      });
    } catch {
      set({
        process: null,
        saveStatus: "error",
      });
    }
  },

  setProcess(process, options) {
    const recordHistory = options?.recordHistory ?? true;
    const markDirty = options?.dirty ?? true;
    const current = get().process;
    set((state) => ({
      process,
      isDirty: markDirty ? true : state.isDirty,
      saveStatus: markDirty ? "dirty" : state.saveStatus,
      past:
        recordHistory && current
          ? [...state.past.slice(-49), cloneProcess(current)]
          : state.past,
      future: recordHistory ? [] : state.future,
      issues: validateProcess(process),
    }));
  },

  setViewMode(mode) {
    set({ viewMode: mode });
  },

  setSelection(nodeIds, edgeIds) {
    set({ selectedNodeIds: nodeIds, selectedEdgeIds: edgeIds });
  },

  undo() {
    const { past, process, future } = get();
    const previous = past[past.length - 1];
    if (!previous || !process) return;
    set({
      process: previous,
      past: past.slice(0, -1),
      future: [cloneProcess(process), ...future].slice(0, 50),
      isDirty: true,
      saveStatus: "dirty",
      issues: validateProcess(previous),
    });
  },

  redo() {
    const { future, process, past } = get();
    const next = future[0];
    if (!next || !process) return;
    set({
      process: next,
      future: future.slice(1),
      past: [...past, cloneProcess(process)].slice(-50),
      isDirty: true,
      saveStatus: "dirty",
      issues: validateProcess(next),
    });
  },

  async save() {
    const { process, isSaving } = get();
    if (!process || isSaving) return;
    set({ isSaving: true, saveStatus: "saving" });
    try {
      const saved = await apiProcessRepository.saveProcess(process);
      set({
        isSaving: false,
        isDirty: false,
        saveStatus: "saved",
        process: saved
          ? {
              ...process,
              version: saved.version,
              updatedAt: saved.updatedAt,
            }
          : process,
      });
    } catch {
      set({ isSaving: false, saveStatus: "error" });
    }
  },

  validate() {
    const process = get().process;
    if (!process) return [];
    const issues = validateProcess(process);
    set({ issues, validationOpen: true });
    return issues;
  },

  setValidationOpen(open) {
    set({ validationOpen: open });
  },

  reset() {
    set({
      process: null,
      saveStatus: "idle",
      isDirty: false,
      past: [],
      future: [],
      selectedNodeIds: [],
      selectedEdgeIds: [],
      issues: [],
    });
  },
}));
