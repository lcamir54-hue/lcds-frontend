import { z } from "zod";

export const assistantModelIdSchema = z.enum(["local", "external", "search"]);

export type AssistantModelId = z.infer<typeof assistantModelIdSchema>;

export const knowledgeKindSchema = z.enum(["topic", "page", "process"]);

export const knowledgeSourceSchema = z.object({
  id: z.string().min(1),
  kind: knowledgeKindSchema,
  title: z.string().min(1),
  icon: z.string().default("📄"),
  topicId: z.string().nullable().default(null),
  topicTitle: z.string().default(""),
  href: z.string().nullable().default(null),
  excerpt: z.string().default(""),
  score: z.number().default(0),
});

export type KnowledgeSource = z.infer<typeof knowledgeSourceSchema>;

export const assistantModelSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  label: z.string().min(1),
  reason: z.string().min(1),
});

export type AssistantModelChoice = z.infer<typeof assistantModelSchema>;

export const assistantTurnTraceSchema = z.object({
  suggestedKnowledge: z.array(knowledgeSourceSchema).default([]),
  suggestedModel: assistantModelSchema,
  usedModel: assistantModelSchema,
  retrievalNote: z.string().default(""),
});

export type AssistantTurnTrace = z.infer<typeof assistantTurnTraceSchema>;

export const chatRoleSchema = z.enum(["user", "assistant"]);

export const chatMessageSchema = z.object({
  id: z.string().min(1),
  role: chatRoleSchema,
  content: z.string(),
  createdAt: z.string(),
  trace: assistantTurnTraceSchema.optional(),
});

export type ChatMessage = z.infer<typeof chatMessageSchema>;

export const conversationSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  createdAt: z.string(),
  updatedAt: z.string(),
  messages: z.array(chatMessageSchema).default([]),
});

export type Conversation = z.infer<typeof conversationSchema>;

export const assistantSnapshotSchema = z.object({
  version: z.literal(1),
  conversations: z.array(conversationSchema).default([]),
});

export type AssistantSnapshot = z.infer<typeof assistantSnapshotSchema>;
