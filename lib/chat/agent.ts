import type { ChatEvent, ChatRequestMessage } from "@/features/chat/types";
import { CHAT_TOOLS, executeChatTool } from "@/lib/chat/lcds-tools";

const LLM_API_BASE = (process.env.LLM_API_BASE ?? "https://api.openai.com/v1").replace(
  /\/$/,
  "",
);
const LLM_API_KEY = process.env.LLM_API_KEY ?? process.env.OPENAI_API_KEY ?? "";
const LLM_MODEL = process.env.LLM_MODEL ?? "gpt-4o-mini";

type OpenAiMessage = {
  role: "system" | "user" | "assistant" | "tool";
  content?: string | null;
  tool_calls?: OpenAiToolCall[];
  tool_call_id?: string;
};

type OpenAiToolCall = {
  id: string;
  type: "function";
  function: { name: string; arguments: string };
};

const SYSTEM_PROMPT = `You are the LCDS knowledge assistant.
Answer in the same language as the user (usually Persian).
Use tools to look up topics, pages, and processes before answering.
Cite titles of documents you used. If nothing is found, say so clearly.
Never invent ids.`;

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function* streamText(text: string, signal?: AbortSignal): AsyncGenerator<ChatEvent> {
  const chunks = text.split(/(\s+)/).filter((part) => part.length > 0);
  for (const chunk of chunks) {
    if (signal?.aborted) return;
    yield { type: "text", delta: chunk };
    await sleep(16);
  }
}

async function* runFallbackAgent(
  messages: ChatRequestMessage[],
  token: string,
  signal?: AbortSignal,
): AsyncGenerator<ChatEvent> {
  const last = messages.at(-1)?.content?.trim() ?? "";
  yield { type: "status", state: "thinking" };
  await sleep(250);
  if (signal?.aborted) return;

  yield { type: "status", state: "using_tools" };
  const searchId = crypto.randomUUID();
  yield {
    type: "tool",
    id: searchId,
    name: "search_knowledge",
    phase: "start",
    args: { query: last },
  };

  let searchJson = "";
  try {
    searchJson = await executeChatTool(
      "search_knowledge",
      JSON.stringify({ query: last }),
      { token, signal },
    );
  } catch (error) {
    yield {
      type: "tool",
      id: searchId,
      name: "search_knowledge",
      phase: "result",
      result: error instanceof Error ? error.message : "جستجو ناموفق بود",
    };
    yield {
      type: "text",
      delta: "نتوانستم درخت دانش را بخوانم. اتصال به سرور را بررسی کنید.",
    };
    return;
  }

  yield {
    type: "tool",
    id: searchId,
    name: "search_knowledge",
    phase: "result",
    result: searchJson,
  };

  const parsed = JSON.parse(searchJson) as {
    items?: Array<{ id: string; kind: string; title: string }>;
  };
  const firstPage = parsed.items?.find((item) => item.kind === "page");
  const firstTopic = parsed.items?.find((item) => item.kind === "topic");
  const firstProcess = parsed.items?.find((item) => item.kind === "process");

  let body = "";
  if (firstPage) {
    const readId = crypto.randomUUID();
    yield {
      type: "tool",
      id: readId,
      name: "read_page",
      phase: "start",
      args: { pageId: firstPage.id },
    };
    try {
      const pageJson = await executeChatTool(
        "read_page",
        JSON.stringify({ pageId: firstPage.id }),
        { token, signal },
      );
      yield {
        type: "tool",
        id: readId,
        name: "read_page",
        phase: "result",
        result: pageJson,
      };
      const page = JSON.parse(pageJson) as { title?: string; markdown?: string };
      body = page.markdown ?? "";
    } catch (error) {
      yield {
        type: "tool",
        id: readId,
        name: "read_page",
        phase: "result",
        result: error instanceof Error ? error.message : "خواندن صفحه ناموفق بود",
      };
    }
  }

  const titles = (parsed.items ?? []).slice(0, 8).map((item) => `- ${item.title} (${item.kind})`);
  const answer = [
    titles.length
      ? `بر اساس دانش قابل دسترس شما این موارد مرتبط پیدا شد:\n${titles.join("\n")}`
      : "در درخت دانش موردی مطابق پرسش شما پیدا نشد.",
    firstPage && body
      ? `\n\nخلاصهٔ «${firstPage.title}»:\n${body.replace(/\s+/g, " ").trim().slice(0, 700)}`
      : firstTopic
        ? `\n\nموضوع مرتبط: «${firstTopic.title}».`
        : firstProcess
          ? `\n\nفرآیند مرتبط: «${firstProcess.title}».`
          : "",
    LLM_API_KEY
      ? ""
      : "\n\n_برای پاسخ مدل زبانی، `LLM_API_KEY` را در محیط سرور تنظیم کنید._",
  ]
    .filter(Boolean)
    .join("");

  yield* streamText(answer, signal);
}

type ToolAccumulator = {
  id?: string;
  name?: string;
  arguments: string;
};

async function* streamLlmChunks(
  messages: OpenAiMessage[],
  signal?: AbortSignal,
): AsyncGenerator<{
  content?: string;
  toolDeltas?: Array<{ index: number; id?: string; name?: string; arguments?: string }>;
  finishReason?: string | null;
}> {
  const res = await fetch(`${LLM_API_BASE}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${LLM_API_KEY}`,
    },
    body: JSON.stringify({
      model: LLM_MODEL,
      stream: true,
      messages,
      tools: CHAT_TOOLS,
      tool_choice: "auto",
    }),
    signal,
  });

  if (!res.ok || !res.body) {
    const detail = await res.text().catch(() => "");
    throw new Error(detail || `LLM HTTP ${res.status}`);
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed.startsWith("data:")) continue;
      const payload = trimmed.slice(5).trim();
      if (!payload || payload === "[DONE]") continue;
      try {
        const json = JSON.parse(payload) as {
          choices?: Array<{
            delta?: {
              content?: string | null;
              tool_calls?: Array<{
                index: number;
                id?: string;
                function?: { name?: string; arguments?: string };
              }>;
            };
            finish_reason?: string | null;
          }>;
        };
        const choice = json.choices?.[0];
        if (!choice) continue;
        yield {
          content: choice.delta?.content ?? undefined,
          toolDeltas: choice.delta?.tool_calls?.map((call) => ({
            index: call.index,
            id: call.id,
            name: call.function?.name,
            arguments: call.function?.arguments,
          })),
          finishReason: choice.finish_reason,
        };
      } catch {
        continue;
      }
    }
  }
}

async function* runLlmAgent(
  messages: ChatRequestMessage[],
  token: string,
  signal?: AbortSignal,
): AsyncGenerator<ChatEvent> {
  const conversation: OpenAiMessage[] = [
    { role: "system", content: SYSTEM_PROMPT },
    ...messages.map((message) => ({
      role: message.role,
      content: message.content,
    })),
  ];

  for (let round = 0; round < 6; round += 1) {
    if (signal?.aborted) return;
    yield { type: "status", state: "thinking" };

    const tools: Record<number, ToolAccumulator> = {};
    let sawTools = false;
    let finishReason: string | null = null;

    try {
      for await (const chunk of streamLlmChunks(conversation, signal)) {
        if (chunk.content) {
          yield { type: "text", delta: chunk.content };
        }
        if (chunk.toolDeltas?.length) {
          if (!sawTools) {
            sawTools = true;
            yield { type: "status", state: "using_tools" };
          }
          for (const delta of chunk.toolDeltas) {
            const current = tools[delta.index] ?? { arguments: "" };
            if (delta.id) current.id = delta.id;
            if (delta.name) current.name = delta.name;
            if (delta.arguments) current.arguments += delta.arguments;
            tools[delta.index] = current;
          }
        }
        if (chunk.finishReason) finishReason = chunk.finishReason;
      }
    } catch (error) {
      yield {
        type: "error",
        detail: error instanceof Error ? error.message : "ارتباط با مدل ناموفق بود",
      };
      return;
    }

    const toolCalls = Object.values(tools).filter((tool) => tool.id && tool.name);
    if (toolCalls.length === 0 || finishReason === "stop") {
      return;
    }

    conversation.push({
      role: "assistant",
      content: null,
      tool_calls: toolCalls.map((tool) => ({
        id: tool.id!,
        type: "function",
        function: { name: tool.name!, arguments: tool.arguments || "{}" },
      })),
    });

    for (const tool of toolCalls) {
      if (signal?.aborted) return;
      const id = tool.id!;
      const name = tool.name!;
      let args: unknown = tool.arguments;
      try {
        args = JSON.parse(tool.arguments || "{}");
      } catch {
        args = { raw: tool.arguments };
      }

      yield { type: "tool", id, name, phase: "start", args };
      try {
        const result = await executeChatTool(name, tool.arguments || "{}", {
          token,
          signal,
        });
        yield { type: "tool", id, name, phase: "result", result };
        conversation.push({
          role: "tool",
          tool_call_id: id,
          content: result,
        });
      } catch (error) {
        const detail = error instanceof Error ? error.message : "اجرای ابزار ناموفق بود";
        yield { type: "tool", id, name, phase: "result", result: detail };
        conversation.push({
          role: "tool",
          tool_call_id: id,
          content: detail,
        });
      }
    }
  }
}

export async function* runChatAgent(
  messages: ChatRequestMessage[],
  token: string,
  signal?: AbortSignal,
): AsyncGenerator<ChatEvent> {
  if (!messages.length) {
    yield { type: "error", detail: "پیامی ارسال نشده است" };
    return;
  }

  if (LLM_API_KEY) {
    yield* runLlmAgent(messages, token, signal);
    return;
  }

  yield* runFallbackAgent(messages, token, signal);
}
