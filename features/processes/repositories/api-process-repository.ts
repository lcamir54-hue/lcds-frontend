import type { ProcessRepository } from "@/features/processes/repositories/process-repository";
import type { ProcessDocument } from "@/features/processes/types/process.types";
import {
  deleteProcess as deleteProcessRequest,
  duplicateProcess as duplicateProcessRequest,
  getProcess,
  saveProcessGraph,
  updateProcess,
} from "@/lib/api/knowledge";
import type { ProcessRead } from "@/lib/api/types";

function asProcessDocument(raw: ProcessRead): ProcessDocument {
  return {
    id: raw.id,
    topicId: raw.topicId,
    type: "process",
    title: raw.title,
    icon: raw.icon || "⚙️",
    status: raw.status,
    version: raw.version,
    ownerId: raw.ownerId,
    canWrite: raw.canWrite,
    sortOrder: raw.sortOrder,
    nodes: (raw.nodes ?? []) as ProcessDocument["nodes"],
    edges: (raw.edges ?? []) as ProcessDocument["edges"],
    viewport: raw.viewport ?? { x: 0, y: 0, zoom: 1 },
    settings: raw.settings ?? {
      snapToGrid: true,
      preventCycles: true,
      layoutDirection: "horizontal",
    },
    createdAt: raw.createdAt,
    updatedAt: raw.updatedAt,
  };
}

export const apiProcessRepository: ProcessRepository = {
  async getProcess(id) {
    return asProcessDocument(await getProcess(id));
  },

  async createProcess() {
    throw new Error("ایجاد فرآیند از طریق موضوع والد انجام می‌شود");
  },

  async saveProcess(process) {
    const saved = await saveProcessGraph(process.id, {
      nodes: process.nodes,
      edges: process.edges,
      viewport: process.viewport,
      settings: process.settings,
    });
    return asProcessDocument(saved);
  },

  async updateMeta(id, input) {
    return asProcessDocument(await updateProcess(id, input));
  },

  async duplicateProcess(id) {
    return asProcessDocument(await duplicateProcessRequest(id));
  },

  async deleteProcess(id) {
    await deleteProcessRequest(id);
  },
};
