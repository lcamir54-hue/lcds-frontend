import type {
  DocumentKind,
  DocumentMeta,
  PublishStatus,
} from "@/features/documents/types";

const FRONTMATTER_RE = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?/;

function parseYamlSimple(yaml: string): Record<string, string | number | null> {
  const result: Record<string, string | number | null> = {};

  for (const line of yaml.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;

    const colon = trimmed.indexOf(":");
    if (colon === -1) continue;

    const key = trimmed.slice(0, colon).trim();
    let value = trimmed.slice(colon + 1).trim();

    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    if (value === "null" || value === "~" || value === "") {
      result[key] = null;
      continue;
    }

    const asNumber = Number(value);
    result[key] = Number.isFinite(asNumber) && value !== "" ? asNumber : value;
  }

  return result;
}

function serializeYamlSimple(data: Record<string, string | number | null>) {
  return Object.entries(data)
    .map(([key, value]) => {
      if (value === null || value === undefined) return `${key}: null`;
      if (typeof value === "number") return `${key}: ${value}`;
      const needsQuotes = /[:#\n]/.test(value) || value.includes(" ");
      return needsQuotes ? `${key}: "${value}"` : `${key}: ${value}`;
    })
    .join("\n");
}

function parseKind(value: string | number | null | undefined): DocumentKind {
  if (value === "topic" || value === "page" || value === "process") {
    return value;
  }
  return "page";
}

function parsePublishStatus(
  value: string | number | null | undefined,
): PublishStatus {
  if (value === "published") return "published";
  return "draft";
}

export function splitFrontmatter(markdown: string): {
  meta: Record<string, string | number | null>;
  body: string;
} {
  const match = FRONTMATTER_RE.exec(markdown);
  if (!match) {
    return { meta: {}, body: markdown };
  }

  return {
    meta: parseYamlSimple(match[1] ?? ""),
    body: markdown.slice(match[0].length),
  };
}

export function parseDocumentMeta(
  markdown: string,
  fallbackId: string,
): DocumentMeta {
  const { meta } = splitFrontmatter(markdown);
  const now = new Date().toISOString().slice(0, 10);
  const parent =
    meta.parent === null || meta.parent === undefined
      ? null
      : String(meta.parent);
  const kind = parseKind(meta.kind);
  const resolvedKind: DocumentKind =
    meta.kind === undefined || meta.kind === null
      ? parent
        ? "page"
        : "topic"
      : kind;

  return {
    id: String(meta.id ?? fallbackId),
    title: String(meta.title ?? "بدون عنوان"),
    icon: String(meta.icon ?? defaultIconForKind(resolvedKind)),
    kind: resolvedKind,
    status: parsePublishStatus(meta.status),
    parent,
    order: typeof meta.order === "number" ? meta.order : Number(meta.order) || 0,
    ownerId: String(meta.ownerId ?? ""),
    allowedGroupIds: parseIdList(meta.allowedGroupIds),
    canWrite: false,
    canCreateChild: false,
    createdAt: String(meta.createdAt ?? now),
    updatedAt: String(meta.updatedAt ?? now),
  };
}

function parseIdList(value: string | number | null | undefined): string[] {
  if (value === null || value === undefined || value === "") return [];
  return String(value)
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

export function defaultIconForKind(kind: DocumentKind): string {
  if (kind === "topic") return "📘";
  if (kind === "process") return "⚙️";
  return "📄";
}

export function buildMarkdownDocument(input: {
  meta: DocumentMeta;
  body: string;
}): string {
  const yamlFields: Record<string, string | number | null> = {
    id: input.meta.id,
    title: input.meta.title,
    icon: input.meta.icon ?? defaultIconForKind(input.meta.kind),
    kind: input.meta.kind,
    parent: input.meta.parent ?? null,
    order: input.meta.order,
    ownerId: input.meta.ownerId || null,
    createdAt: input.meta.createdAt,
    updatedAt: input.meta.updatedAt,
  };

  if (input.meta.kind === "topic") {
    yamlFields.allowedGroupIds =
      (input.meta.allowedGroupIds ?? []).join(",") || null;
  }

  if (input.meta.kind === "page" || input.meta.kind === "process") {
    yamlFields.status = input.meta.status ?? "draft";
  }

  const yaml = serializeYamlSimple(yamlFields);
  const body = input.body.replace(/^\n+/, "");
  return `---\n${yaml}\n---\n\n${body}`;
}

export function updateFrontmatter(
  markdown: string,
  patch: Partial<DocumentMeta>,
): string {
  const { body } = splitFrontmatter(markdown);
  const current = parseDocumentMeta(markdown, patch.id ?? "unknown");
  return buildMarkdownDocument({
    meta: { ...current, ...patch },
    body,
  });
}

export function getMarkdownBody(markdown: string): string {
  return splitFrontmatter(markdown).body;
}
