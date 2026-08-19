import type { DocumentMeta } from "@/features/documents/types";

export function knowledgeItemHref(meta: Pick<DocumentMeta, "id" | "kind" | "parent">) {
  if (!meta.parent) return null;
  if (meta.kind === "page") {
    return `/knowledge/${meta.parent}/page/${meta.id}`;
  }
  if (meta.kind === "process") {
    return `/knowledge/${meta.parent}/process/${meta.id}`;
  }
  return null;
}
