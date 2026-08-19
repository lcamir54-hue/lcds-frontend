import type { ChatEvent, ChatRequestMessage } from "@/features/chat/types";
import { runChatAgent } from "@/lib/chat/agent";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

function encodeEvent(event: ChatEvent) {
  return new TextEncoder().encode(`data: ${JSON.stringify(event)}\n\n`);
}

export async function POST(request: Request) {
  const auth = request.headers.get("authorization") ?? "";
  const token = auth.replace(/^Bearer\s+/i, "").trim();
  if (!token) {
    return Response.json(
      { detail: "احراز هویت لازم است", code: "UNAUTHORIZED" },
      { status: 401 },
    );
  }

  let messages: ChatRequestMessage[] = [];
  try {
    const body = (await request.json()) as { messages?: ChatRequestMessage[] };
    messages = Array.isArray(body.messages) ? body.messages : [];
  } catch {
    return Response.json(
      { detail: "بدنه درخواست نامعتبر است", code: "VALIDATION_ERROR" },
      { status: 422 },
    );
  }

  const abort = new AbortController();
  request.signal.addEventListener("abort", () => abort.abort(), { once: true });

  const stream = new ReadableStream({
    async start(controller) {
      try {
        for await (const event of runChatAgent(messages, token, abort.signal)) {
          if (abort.signal.aborted) break;
          controller.enqueue(encodeEvent(event));
        }
        if (!abort.signal.aborted) {
          controller.enqueue(encodeEvent({ type: "done" }));
        }
      } catch (error) {
        controller.enqueue(
          encodeEvent({
            type: "error",
            detail: error instanceof Error ? error.message : "خطای غیرمنتظره",
          }),
        );
        controller.enqueue(encodeEvent({ type: "done" }));
      } finally {
        controller.close();
      }
    },
    cancel() {
      abort.abort();
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
