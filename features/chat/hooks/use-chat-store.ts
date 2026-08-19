"use client";

import { create } from "zustand";

import { streamChat } from "@/features/chat/lib/stream-chat";
import type {
  ChatMessage,
  ChatRequestMessage,
  ChatToolCall,
} from "@/features/chat/types";

type ChatStore = {
  open: boolean;
  messages: ChatMessage[];
  isStreaming: boolean;
  setOpen: (open: boolean) => void;
  toggle: () => void;
  stop: () => void;
  send: (content: string) => Promise<void>;
};

let abortController: AbortController | null = null;

function newId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function toRequestMessages(messages: ChatMessage[]): ChatRequestMessage[] {
  return messages
    .filter((message) => message.content.trim().length > 0 || message.role === "user")
    .map((message) => ({
      role: message.role,
      content: message.content,
    }));
}

function upsertTool(tools: ChatToolCall[], next: ChatToolCall): ChatToolCall[] {
  const index = tools.findIndex((tool) => tool.id === next.id);
  if (index === -1) return [...tools, next];
  const copy = [...tools];
  copy[index] = { ...copy[index], ...next };
  return copy;
}

export const useChatStore = create<ChatStore>((set, get) => ({
  open: false,
  messages: [],
  isStreaming: false,

  setOpen(open) {
    set({ open });
  },

  toggle() {
    set((state) => ({ open: !state.open }));
  },

  stop() {
    abortController?.abort();
    abortController = null;
    set((state) => ({
      isStreaming: false,
      messages: state.messages.map((message) =>
        message.isStreaming
          ? { ...message, isStreaming: false, status: null }
          : message,
      ),
    }));
  },

  async send(content) {
    const trimmed = content.trim();
    if (!trimmed || get().isStreaming) return;

    abortController?.abort();
    abortController = new AbortController();
    const signal = abortController.signal;

    const userMessage: ChatMessage = {
      id: newId(),
      role: "user",
      content: trimmed,
      status: null,
      steps: [],
      tools: [],
      isStreaming: false,
    };
    const assistantMessage: ChatMessage = {
      id: newId(),
      role: "assistant",
      content: "",
      status: "thinking",
      steps: [],
      tools: [],
      isStreaming: true,
    };

    const history = [...get().messages, userMessage];
    set({
      open: true,
      isStreaming: true,
      messages: [...history, assistantMessage],
    });

    const apply = (updater: (message: ChatMessage) => ChatMessage) => {
      set((state) => ({
        messages: state.messages.map((message) =>
          message.id === assistantMessage.id ? updater(message) : message,
        ),
      }));
    };

    try {
      await streamChat(
        toRequestMessages(history),
        (event) => {
          if (event.type === "status") {
            apply((message) => {
              const steps =
                message.status && message.status !== event.state
                  ? message.steps.includes(message.status)
                    ? message.steps
                    : [...message.steps, message.status]
                  : message.steps;
              return { ...message, steps, status: event.state };
            });
            return;
          }
          if (event.type === "tool") {
            apply((message) => ({
              ...message,
              status: event.phase === "start" ? "using_tools" : message.status,
              tools: upsertTool(message.tools, {
                id: event.id,
                name: event.name,
                phase: event.phase === "result" ? "done" : "running",
                args: event.args,
                result: event.result,
              }),
            }));
            return;
          }
          if (event.type === "text") {
            apply((message) => {
              const steps =
                message.status && !message.steps.includes(message.status)
                  ? [...message.steps, message.status]
                  : message.steps;
              return {
                ...message,
                steps,
                status: null,
                content: message.content + event.delta,
              };
            });
            return;
          }
          if (event.type === "error") {
            apply((message) => ({
              ...message,
              error: event.detail,
              isStreaming: false,
              status: null,
            }));
            return;
          }
          if (event.type === "done") {
            apply((message) => ({
              ...message,
              isStreaming: false,
              status: null,
              steps:
                message.status && !message.steps.includes(message.status)
                  ? [...message.steps, message.status]
                  : message.steps,
            }));
          }
        },
        signal,
      );
    } catch (error) {
      if (signal.aborted) return;
      apply((message) => ({
        ...message,
        isStreaming: false,
        status: null,
        error: error instanceof Error ? error.message : "گفتگو قطع شد",
      }));
    } finally {
      abortController = null;
      set({ isStreaming: false });
      apply((message) => ({ ...message, isStreaming: false, status: message.content ? null : message.status }));
    }
  },
}));
