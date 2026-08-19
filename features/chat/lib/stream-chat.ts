import { getAccessToken } from "@/features/auth/lib/auth-session";
import type { ChatEvent, ChatRequestMessage } from "@/features/chat/types";

export async function streamChat(
  messages: ChatRequestMessage[],
  onEvent: (event: ChatEvent) => void,
  signal?: AbortSignal,
) {
  const token = getAccessToken();
  if (!token) {
    onEvent({ type: "error", detail: "احراز هویت لازم است" });
    onEvent({ type: "done" });
    return;
  }

  const res = await fetch("/api/chat", {
    method: "POST",
    headers: {
      Accept: "text/event-stream",
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ messages }),
    signal,
  });

  if (!res.ok || !res.body) {
    const data = await res.json().catch(() => null);
    onEvent({
      type: "error",
      detail: typeof data?.detail === "string" ? data.detail : "شروع گفتگو ناموفق بود",
    });
    onEvent({ type: "done" });
    return;
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const parts = buffer.split("\n\n");
    buffer = parts.pop() ?? "";

    for (const part of parts) {
      const line = part
        .split("\n")
        .map((item) => item.trim())
        .find((item) => item.startsWith("data:"));
      if (!line) continue;
      const payload = line.slice(5).trim();
      if (!payload) continue;
      try {
        onEvent(JSON.parse(payload) as ChatEvent);
      } catch {
        // Ignore a partial SSE frame; the next read will complete it.
      }
    }
  }

  if (buffer.trim().startsWith("data:")) {
    const payload = buffer.trim().slice(5).trim();
    if (payload) {
      try {
        onEvent(JSON.parse(payload) as ChatEvent);
      } catch {
        // Drop a trailing incomplete frame.
      }
    }
  }
}
