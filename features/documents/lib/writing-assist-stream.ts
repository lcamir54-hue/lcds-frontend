import { RAG_PROXY_PREFIX } from "@/lib/api/config";

export type LlmSseEvent =
  | { type: "start"; provider: string; model: string }
  | { type: "token"; text: string }
  | { type: "done" };

function llmProxyUrl() {
  return `${RAG_PROXY_PREFIX}/llm/external/stream`;
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

async function readStreamError(res: Response): Promise<string> {
  const data = await res.json().catch(() => null);
  const detail = detailFromBody(data);
  if (detail) return detail;
  if (res.status === 404) return "سرویس مدل یافت نشد.";
  if (res.status === 503) return "سرویس مدل در دسترس نیست.";
  if (res.status === 422) return "درخواست ارسال‌شده معتبر نیست.";
  return "پاسخ مدل کامل نشد.";
}

function parseSseBlock(block: string): LlmSseEvent | null {
  const data = block
    .split("\n")
    .filter((line) => line.startsWith("data:"))
    .map((line) => line.slice(5).trimStart())
    .join("\n");
  if (!data) return null;
  try {
    const event = JSON.parse(data) as LlmSseEvent;
    if (!event || typeof event !== "object" || !("type" in event)) return null;
    return event;
  } catch {
    return null;
  }
}

export async function streamExternalLlm(input: {
  prompt: string;
  systemPrompt?: string;
  signal?: AbortSignal;
  onEvent: (event: LlmSseEvent) => void;
}): Promise<void> {
  const body: { prompt: string; system_prompt?: string } = {
    prompt: input.prompt,
  };
  if (input.systemPrompt?.trim()) {
    body.system_prompt = input.systemPrompt.trim();
  }

  const res = await fetch(llmProxyUrl(), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "text/event-stream",
    },
    body: JSON.stringify(body),
    cache: "no-store",
    signal: input.signal,
  });

  if (!res.ok || !res.body) {
    throw new Error(await readStreamError(res));
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
