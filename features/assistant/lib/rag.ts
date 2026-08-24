import { RAG_PROXY_PREFIX } from "@/lib/api/config";
import type { KnowledgeSource } from "@/features/assistant/types";

export type RagChatProvider = "local" | "external";
export type AssistantMode = RagChatProvider | "search";

export type RagSearchHit = {
  rank: number;
  score: number;
  title: string;
  section_id: string;
  text: string;
  metadata?: {
    source?: string;
    title?: string;
    section_id?: string;
    source_indexes?: string;
    position?: number;
  };
};

export type RagSearchResponse = {
  query: string;
  count: number;
  results: RagSearchHit[];
};

export type RagContextSource = {
  rank: number;
  score: number;
  title: string;
  section_id: string;
};

export type RagSseEvent =
  | { type: "start"; provider: string; model: string }
  | { type: "context"; count: number; sources: RagContextSource[] }
  | { type: "token"; text: string }
  | { type: "done" };

const DEFAULT_TOP_K = 5;
const DEFAULT_THRESHOLD = 0.2;

function ragProxyUrl(path: string) {
  return `${RAG_PROXY_PREFIX}/${path}`;
}

function detailFromBody(data: unknown): string | null {
  if (!data || typeof data !== "object" || !("detail" in data)) return null;
  const detail = (data as { detail: unknown }).detail;
  if (typeof detail === "string" && detail.trim()) return detail;
  if (Array.isArray(detail)) {
    const messages = detail
      .map((item) => {
        if (item && typeof item === "object" && "msg" in item) {
          return String((item as { msg: unknown }).msg);
        }
        return "";
      })
      .filter(Boolean);
    return messages.length > 0 ? messages.join(" ") : null;
  }
  return null;
}

export function ragErrorMessage(status: number, data: unknown): string {
  const detail = detailFromBody(data);
  if (detail) return detail;
  if (status === 503) return "سرویس مدل در دسترس نیست.";
  if (status === 422) return "پرسش ارسال‌شده معتبر نیست.";
  return "پاسخ این نوبت کامل نشد.";
}

async function readError(res: Response): Promise<string> {
  const data = await res.json().catch(() => null);
  return ragErrorMessage(res.status, data);
}

export async function searchRag(query: string): Promise<RagSearchResponse> {
  const res = await fetch(ragProxyUrl("search"), {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({
      query,
      top_k: DEFAULT_TOP_K,
      threshold: DEFAULT_THRESHOLD,
    }),
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error(await readError(res));
  }

  return (await res.json()) as RagSearchResponse;
}

function parseSseBlock(block: string): RagSseEvent | null {
  const data = block
    .split("\n")
    .filter((line) => line.startsWith("data:"))
    .map((line) => line.slice(5).trimStart())
    .join("\n");
  if (!data) return null;
  try {
    const event = JSON.parse(data) as RagSseEvent;
    if (!event || typeof event !== "object" || !("type" in event)) return null;
    return event;
  } catch {
    return null;
  }
}

export async function streamRagChat(input: {
  provider: RagChatProvider;
  query: string;
  signal?: AbortSignal;
  onEvent: (event: RagSseEvent) => void;
}): Promise<void> {
  const path = input.provider === "local" ? "chat/local" : "chat/external";
  const res = await fetch(ragProxyUrl(path), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "text/event-stream",
    },
    body: JSON.stringify({
      query: input.query,
      top_k: DEFAULT_TOP_K,
      threshold: DEFAULT_THRESHOLD,
    }),
    cache: "no-store",
    signal: input.signal,
  });

  if (!res.ok || !res.body) {
    throw new Error(await readError(res));
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true }).replace(/\r\n/g, "\n");

    const parts = buffer.split("\n\n");
    buffer = parts.pop() ?? "";

    for (const part of parts) {
      const event = parseSseBlock(part.trim());
      if (!event) continue;
      input.onEvent(event);
      if (event.type === "done") return;
    }
  }

  const last = parseSseBlock(buffer.trim());
  if (last) input.onEvent(last);
}

export function knowledgeFromSearchHits(
  hits: RagSearchHit[],
): KnowledgeSource[] {
  return hits.map((hit) => ({
    id: `${hit.section_id}-${hit.rank}`,
    kind: "page",
    title: hit.title,
    icon: "📄",
    topicId: null,
    topicTitle: hit.metadata?.source ?? "",
    href: null,
    excerpt: hit.text.replace(/\s+/g, " ").trim().slice(0, 220),
    score: hit.score,
  }));
}

export function knowledgeFromContextSources(
  sources: RagContextSource[],
): KnowledgeSource[] {
  return sources.map((source) => ({
    id: `${source.section_id}-${source.rank}`,
    kind: "page",
    title: source.title,
    icon: "📄",
    topicId: null,
    topicTitle: "",
    href: null,
    excerpt: "",
    score: source.score,
  }));
}

export function retrievalNoteFor(count: number) {
  if (count === 0) {
    return "برای این پرسش، دانش سازمانی مرتبطی پیشنهاد نشد.";
  }
  return `${new Intl.NumberFormat("fa-IR").format(count)} دانش سازمانی برای این پرسش پیشنهاد شد.`;
}

export function composeSearchAnswer(
  query: string,
  result: RagSearchResponse,
): string {
  if (result.count === 0 || result.results.length === 0) {
    return [
      `برای «${query}» دانش سازمانی مرتبطی پیدا نشد.`,
      "",
      "پرسش را با نام بخش، عنوان یا عبارت دقیق‌تر تکرار کنید.",
    ].join("\n");
  }

  const blocks = result.results.map((hit) => {
    const score = new Intl.NumberFormat("fa-IR", {
      maximumFractionDigits: 4,
    }).format(hit.score);
    const source = hit.metadata?.source?.trim();
    const heading = `### ${new Intl.NumberFormat("fa-IR").format(hit.rank)}. ${hit.title}`;
    const meta = [
      `امتیاز شباهت: ${score}`,
      hit.section_id ? `بخش: ${hit.section_id}` : "",
      source ? `منبع: ${source}` : "",
    ]
      .filter(Boolean)
      .join(" · ");
    return [heading, "", meta, "", hit.text.trim()].join("\n");
  });

  return [
    `${new Intl.NumberFormat("fa-IR").format(result.count)} نتیجه برای «${query}»:`,
    "",
    blocks.join("\n\n---\n\n"),
  ].join("\n");
}
