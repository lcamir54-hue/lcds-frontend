import { z } from "zod";

export const documentKindSchema = z.enum(["topic", "page", "process"]);

export type DocumentKind = z.infer<typeof documentKindSchema>;

export const publishStatusSchema = z.enum(["draft", "published"]);

export type PublishStatus = z.infer<typeof publishStatusSchema>;

export const PUBLISH_STATUS_LABELS: Record<PublishStatus, string> = {
  draft: "پیش نویس",
  published: "انتشار",
};

export const documentMetaSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  icon: z.string().optional().default("📄"),
  kind: documentKindSchema.default("page"),
  status: publishStatusSchema.default("draft"),
  parent: z.string().nullable().optional().default(null),
  order: z.number().int().default(0),
  ownerId: z.string().optional().default(""),
  allowedGroupIds: z.array(z.string()).optional().default([]),
  canWrite: z.boolean().optional().default(false),
  canCreateChild: z.boolean().optional().default(false),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type DocumentMeta = z.infer<typeof documentMetaSchema>;

export const markdownDocumentSchema = z.object({
  id: z.string().min(1),
  markdown: z.string(),
});

export type MarkdownDocument = z.infer<typeof markdownDocumentSchema>;

export const createDocumentInputSchema = z.object({
  id: z.string().optional(),
  title: z.string().min(1),
  icon: z.string().optional(),
  kind: documentKindSchema.optional(),
  status: publishStatusSchema.optional(),
  parentId: z.string().nullable().optional(),
  markdownBody: z.string().optional(),
  ownerId: z.string().optional(),
  allowedGroupIds: z.array(z.string()).optional(),
});

export type CreateDocumentInput = z.infer<typeof createDocumentInputSchema>;

export type ViewMode = "edit" | "read";

export type SaveStatus =
  | "idle"
  | "saving"
  | "saved"
  | "error"
  | "readonly";

export type OutlineHeading = {
  id: string;
  text: string;
  level: 1 | 2 | 3 | 4 | 5 | 6;
};

export const TOPIC_ICON_OPTIONS = [
  "📘",
  "📗",
  "📙",
  "📕",
  "🎯",
  "💎",
  "🏢",
  "📝",
  "🗺️",
  "📊",
  "📅",
  "⚙️",
  "🚀",
  "🛠️",
  "🚩",
  "💡",
] as const;
