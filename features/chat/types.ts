export type ChatRole = "user" | "assistant";

export type ChatStatusState = "thinking" | "using_tools";

export type ChatToolPhase = "start" | "result";

export type ChatToolCall = {
  id: string;
  name: string;
  phase: "running" | "done";
  args?: unknown;
  result?: string;
};

export type ChatEvent =
  | { type: "status"; state: ChatStatusState }
  | {
      type: "tool";
      id: string;
      name: string;
      phase: ChatToolPhase;
      args?: unknown;
      result?: string;
    }
  | { type: "text"; delta: string }
  | { type: "error"; detail: string }
  | { type: "done" };

export type ChatRequestMessage = {
  role: ChatRole;
  content: string;
};

export type ChatMessage = {
  id: string;
  role: ChatRole;
  content: string;
  status: ChatStatusState | null;
  steps: ChatStatusState[];
  tools: ChatToolCall[];
  isStreaming: boolean;
  error?: string;
};
