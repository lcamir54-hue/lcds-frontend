import { z } from "zod";

export const processObjectTypeSchema = z.enum([
  "start",
  "end",
  "action",
  "decision",
  "condition",
  "wait",
  "delay",
  "merge",
  "split",
  "subprocess",
  "user",
  "role",
  "department",
  "approver",
  "assignee",
  "reviewer",
  "data-input",
  "data-output",
  "document",
  "form",
  "database",
  "file",
  "report",
  "send-message",
  "email",
  "notification",
  "request",
  "response",
  "internal-system",
  "external-service",
  "api",
  "automation",
  "manual-task",
  "note",
  "group",
  "container",
  "guide",
  "label",
  "swimlane",
]);

export type ProcessObjectType = z.infer<typeof processObjectTypeSchema>;

export const processNodeStatusSchema = z.enum([
  "default",
  "completed",
  "in-progress",
  "warning",
  "error",
  "disabled",
]);

export type ProcessNodeStatus = z.infer<typeof processNodeStatusSchema>;

export const processNodeDataSchema = z.object({
  objectType: processObjectTypeSchema,
  title: z.string(),
  description: z.string().optional().default(""),
  icon: z.string().optional(),
  status: processNodeStatusSchema.default("default"),
  assignee: z.string().optional().default(""),
  role: z.string().optional().default(""),
  department: z.string().optional().default(""),
  duration: z.string().optional().default(""),
  input: z.string().optional().default(""),
  output: z.string().optional().default(""),
  relatedPageId: z.string().optional().nullable().default(null),
  relatedProcessId: z.string().optional().nullable().default(null),
  conditions: z.string().optional().default(""),
  notes: z.string().optional().default(""),
  color: z.string().optional().default(""),
  locked: z.boolean().optional().default(false),
  branches: z.array(z.string()).optional().default(["بله", "خیر"]),
});

export type ProcessNodeData = z.infer<typeof processNodeDataSchema>;

export const processNodeSchema = z.object({
  id: z.string(),
  type: z.string().optional().default("process"),
  position: z.object({ x: z.number(), y: z.number() }),
  data: processNodeDataSchema,
  width: z.number().optional().nullable(),
  height: z.number().optional().nullable(),
  parentId: z.string().optional().nullable(),
  extent: z.string().optional().nullable(),
  zIndex: z.number().optional().nullable(),
});

export type ProcessNode = z.infer<typeof processNodeSchema>;

export const processEdgeSchema = z.object({
  id: z.string(),
  source: z.string(),
  target: z.string(),
  sourceHandle: z.string().optional().nullable(),
  targetHandle: z.string().optional().nullable(),
  type: z.enum(["default", "smoothstep", "straight", "bezier"]).default("smoothstep"),
  label: z.string().optional().default(""),
  animated: z.boolean().optional().default(false),
  style: z
    .object({
      stroke: z.string().optional(),
    })
    .optional(),
  data: z
    .object({
      condition: z.string().optional().default(""),
      color: z.string().optional().default(""),
      arrowStyle: z.enum(["arrow", "arrowclosed"]).optional().default("arrowclosed"),
    })
    .optional(),
});

export type ProcessEdge = z.infer<typeof processEdgeSchema>;

export const processDocumentSchema = z.object({
  id: z.string(),
  topicId: z.string(),
  type: z.literal("process"),
  title: z.string(),
  icon: z.string().optional().default("⚙️"),
  status: z.enum(["draft", "published"]).default("draft"),
  version: z.number().int().default(1),
  ownerId: z.string().optional().default(""),
  canWrite: z.boolean().optional().default(false),
  sortOrder: z.number().int().optional().default(0),
  nodes: z.array(processNodeSchema),
  edges: z.array(processEdgeSchema),
  viewport: z.object({
    x: z.number(),
    y: z.number(),
    zoom: z.number(),
  }),
  settings: z.object({
    snapToGrid: z.boolean().default(true),
    preventCycles: z.boolean().default(true),
    layoutDirection: z.enum(["horizontal", "vertical"]).default("horizontal"),
  }),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type ProcessDocument = z.infer<typeof processDocumentSchema>;

export const createProcessInputSchema = z.object({
  topicId: z.string().min(1),
  title: z.string().min(1),
  icon: z.string().optional(),
});

export type CreateProcessInput = z.infer<typeof createProcessInputSchema>;

export type ProcessSaveStatus =
  | "idle"
  | "saving"
  | "saved"
  | "error"
  | "dirty";

export type ProcessViewMode = "design" | "view";

export type ProcessValidationIssue = {
  id: string;
  severity: "error" | "warning";
  message: string;
  nodeId?: string;
  edgeId?: string;
};
