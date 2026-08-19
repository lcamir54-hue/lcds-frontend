import { nanoid } from "nanoid";

import { SEED_DOCUMENTS } from "@/features/documents/data/seed-documents";
import {
  buildMarkdownDocument,
  defaultIconForKind,
  parseDocumentMeta,
  updateFrontmatter,
} from "@/features/documents/lib/frontmatter";
import type { DocumentRepository } from "@/features/documents/repositories/document-repository";
import type {
  CreateDocumentInput,
  MarkdownDocument,
} from "@/features/documents/types";

const STORAGE_KEY = "lcds.documents.v5";
const DRAFT_KEY_PREFIX = "lcds.document.draft.";

function delay(ms = 120) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function readAll(): MarkdownDocument[] {
  if (typeof window === "undefined") return [...SEED_DOCUMENTS];

  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(SEED_DOCUMENTS));
    return [...SEED_DOCUMENTS];
  }

  try {
    const parsed = JSON.parse(raw) as MarkdownDocument[];
    if (!Array.isArray(parsed) || parsed.length === 0) {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(SEED_DOCUMENTS));
      return [...SEED_DOCUMENTS];
    }
    return parsed;
  } catch {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(SEED_DOCUMENTS));
    return [...SEED_DOCUMENTS];
  }
}

function writeAll(documents: MarkdownDocument[]) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(documents));
}

export function getDraftKey(id: string) {
  return `${DRAFT_KEY_PREFIX}${id}`;
}

export function readDraft(id: string): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(getDraftKey(id));
}

export function writeDraft(id: string, markdown: string) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(getDraftKey(id), markdown);
}

export function clearDraft(id: string) {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(getDraftKey(id));
}

export const localDocumentRepository: DocumentRepository = {
  async listDocuments() {
    await delay();
    return readAll();
  },

  async getDocument(id) {
    await delay();
    const found = readAll().find((doc) => doc.id === id);
    if (!found) throw new Error(`سند یافت نشد: ${id}`);
    return found;
  },

  async saveDocument(document) {
    await delay(180);
    const all = readAll();
    const index = all.findIndex((doc) => doc.id === document.id);
    const nextMeta = parseDocumentMeta(document.markdown, document.id);
    const withStamp = {
      ...document,
      markdown: updateFrontmatter(document.markdown, {
        ...nextMeta,
        updatedAt: new Date().toISOString().slice(0, 10),
      }),
    };

    if (index === -1) {
      all.push(withStamp);
    } else {
      all[index] = withStamp;
    }

    writeAll(all);
    clearDraft(document.id);
  },

  async createDocument(input: CreateDocumentInput) {
    await delay();
    const id = input.id ?? nanoid(10);
    const now = new Date().toISOString().slice(0, 10);
    const kind = input.kind ?? (input.parentId ? "page" : "topic");
    const siblings = readAll()
      .map((doc) => parseDocumentMeta(doc.markdown, doc.id))
      .filter((meta) => (meta.parent ?? null) === (input.parentId ?? null));
    const order =
      siblings.reduce((max, item) => Math.max(max, item.order), 0) + 1;

    const markdown = buildMarkdownDocument({
      meta: {
        id,
        title: input.title,
        icon: input.icon ?? defaultIconForKind(kind),
        kind,
        status: input.status ?? "draft",
        parent: input.parentId ?? null,
        order,
        ownerId: input.ownerId ?? "",
        allowedGroupIds:
          kind === "topic" ? [...new Set(input.allowedGroupIds ?? [])] : [],
        canWrite: true,
        canCreateChild: kind === "topic",
        createdAt: now,
        updatedAt: now,
      },
      body:
        kind === "process" || kind === "topic"
          ? ""
          : input.markdownBody?.trim() || `# ${input.title}\n\n`,
    });

    const document: MarkdownDocument = { id, markdown };
    const all = readAll();
    all.push(document);
    writeAll(all);
    return document;
  },

  async deleteDocument(id) {
    await delay();
    const all = readAll();
    const remaining = all.filter((doc) => {
      const meta = parseDocumentMeta(doc.markdown, doc.id);
      return doc.id !== id && meta.parent !== id;
    });
    writeAll(remaining);
    clearDraft(id);
  },

  async duplicateDocument(id, options) {
    await delay();
    const source = await this.getDocument(id);
    const meta = parseDocumentMeta(source.markdown, source.id);
    const created = await this.createDocument({
      title: `${meta.title} (رونوشت)`,
      icon: meta.icon,
      kind: meta.kind,
      parentId: meta.parent,
      ownerId: options?.ownerId ?? meta.ownerId,
      allowedGroupIds: meta.kind === "topic" ? meta.allowedGroupIds : undefined,
      markdownBody: source.markdown.replace(/^---[\s\S]*?---\s*/, ""),
    });
    return created;
  },
};
