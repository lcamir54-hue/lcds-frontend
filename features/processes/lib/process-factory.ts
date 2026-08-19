import { nanoid } from "nanoid";

import { findLibraryItem } from "@/features/processes/lib/process-library";
import type {
  CreateProcessInput,
  ProcessDocument,
  ProcessNode,
  ProcessNodeData,
  ProcessObjectType,
} from "@/features/processes/types/process.types";

export function createDefaultNodeData(
  objectType: ProcessObjectType,
  title?: string,
): ProcessNodeData {
  const item = findLibraryItem(objectType);
  return {
    objectType,
    title: title ?? item?.label ?? "گره جدید",
    description: item?.description ?? "",
    icon: item?.icon,
    status: "default",
    assignee: "",
    role: "",
    department: "",
    duration: "",
    input: "",
    output: "",
    relatedPageId: null,
    relatedProcessId: null,
    conditions: "",
    notes: "",
    color: "",
    locked: false,
    branches: objectType === "decision" ? ["بله", "خیر"] : [],
  };
}

export function createProcessNode(
  objectType: ProcessObjectType,
  position: { x: number; y: number },
  title?: string,
): ProcessNode {
  return {
    id: nanoid(10),
    type: "process",
    position,
    data: createDefaultNodeData(objectType, title),
  };
}

export function createEmptyProcess(
  input: CreateProcessInput & { id: string },
): ProcessDocument {
  const now = new Date().toISOString();
  const start = createProcessNode("start", { x: 80, y: 160 }, "شروع");

  return {
    id: input.id,
    topicId: input.topicId,
    type: "process",
    title: input.title,
    icon: input.icon ?? "⚙️",
    status: "draft",
    version: 1,
    ownerId: "",
    canWrite: true,
    sortOrder: 0,
    nodes: [start],
    edges: [],
    viewport: { x: 0, y: 0, zoom: 1 },
    settings: {
      snapToGrid: true,
      preventCycles: true,
      layoutDirection: "horizontal",
    },
    createdAt: now,
    updatedAt: now,
  };
}
