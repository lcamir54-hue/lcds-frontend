import { nanoid } from "nanoid";

import { createEmptyProcess } from "@/features/processes/lib/process-factory";
import type { ProcessRepository } from "@/features/processes/repositories/process-repository";
import type { ProcessDocument } from "@/features/processes/types/process.types";

const STORAGE_KEY = "lcds.processes.v1";
const DRAFT_KEY_PREFIX = "lcds.process.draft.";

function delay(ms = 100) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function readAll(): Record<string, ProcessDocument> {
  if (typeof window === "undefined") return {};
  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) return {};
  try {
    return JSON.parse(raw) as Record<string, ProcessDocument>;
  } catch {
    return {};
  }
}

function writeAll(data: Record<string, ProcessDocument>) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

export function readProcessDraft(id: string): ProcessDocument | null {
  if (typeof window === "undefined") return null;
  const raw = window.localStorage.getItem(`${DRAFT_KEY_PREFIX}${id}`);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as ProcessDocument;
  } catch {
    return null;
  }
}

export function writeProcessDraft(process: ProcessDocument) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(
    `${DRAFT_KEY_PREFIX}${process.id}`,
    JSON.stringify(process),
  );
}

export function clearProcessDraft(id: string) {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(`${DRAFT_KEY_PREFIX}${id}`);
}

export const localProcessRepository: ProcessRepository = {
  async getProcess(id) {
    await delay();
    const draft = readProcessDraft(id);
    if (draft) {
      return { ...draft, status: draft.status ?? "draft" };
    }
    const all = readAll();
    const found = all[id];
    if (!found) throw new Error(`فرآیند یافت نشد: ${id}`);
    return { ...found, status: found.status ?? "draft" };
  },

  async createProcess(input) {
    await delay();
    const process = createEmptyProcess(input);
    const all = readAll();
    all[process.id] = process;
    writeAll(all);
    clearProcessDraft(process.id);
    return process;
  },

  async saveProcess(process) {
    await delay(160);
    const all = readAll();
    all[process.id] = {
      ...process,
      updatedAt: new Date().toISOString(),
      version: process.version + 1,
    };
    writeAll(all);
    clearProcessDraft(process.id);
  },

  async duplicateProcess(id) {
    await delay();
    const source = await this.getProcess(id);
    const copy: ProcessDocument = {
      ...structuredClone(source),
      id: nanoid(10),
      title: `${source.title} (رونوشت)`,
      status: "draft",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      version: 1,
    };
    const all = readAll();
    all[copy.id] = copy;
    writeAll(all);
    return copy;
  },

  async deleteProcess(id) {
    await delay();
    const all = readAll();
    delete all[id];
    writeAll(all);
    clearProcessDraft(id);
  },
};
