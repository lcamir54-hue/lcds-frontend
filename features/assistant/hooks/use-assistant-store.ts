"use client";

import { nanoid } from "nanoid";
import { create } from "zustand";

import { assistantProviderChoice } from "@/features/assistant/lib/models";
import {
  composeSearchAnswer,
  knowledgeFromContextSources,
  knowledgeFromSearchHits,
  retrievalNoteFor,
  searchRag,
  streamRagChat,
  type AssistantMode,
} from "@/features/assistant/lib/rag";
import {
  loadAssistantSnapshot,
  saveAssistantSnapshot,
} from "@/features/assistant/lib/storage";
import { titleFromQuery } from "@/features/assistant/lib/text";
import type {
  AssistantModelChoice,
  ChatMessage,
  Conversation,
  KnowledgeSource,
} from "@/features/assistant/types";
import { getSessionUser } from "@/features/auth/lib/auth-session";

function nowIso() {
  return new Date().toISOString();
}

function sortConversations(conversations: Conversation[]) {
  return [...conversations].sort(
    (a, b) => Date.parse(b.updatedAt) - Date.parse(a.updatedAt),
  );
}

type AssistantState = {
  hydrated: boolean;
  userId: string | null;
  conversations: Conversation[];
  activeId: string | null;
  sending: boolean;
  memoryOpen: boolean;
  selectedProvider: AssistantMode;
  bootstrap: () => void;
  setActiveId: (id: string | null) => void;
  setMemoryOpen: (open: boolean) => void;
  setSelectedProvider: (provider: AssistantMode) => void;
  createConversation: () => string;
  deleteConversation: (id: string) => void;
  sendMessage: (content: string) => Promise<string | null>;
};

export const useAssistantStore = create<AssistantState>((set, get) => {
  const persist = () => {
    const { userId, conversations } = get();
    if (!userId) return;
    saveAssistantSnapshot(userId, conversations);
  };

  const patchConversation = (
    id: string,
    updater: (conversation: Conversation) => Conversation,
  ) => {
    set((state) => ({
      conversations: sortConversations(
        state.conversations.map((conversation) =>
          conversation.id === id ? updater(conversation) : conversation,
        ),
      ),
    }));
    persist();
  };

  return {
    hydrated: false,
    userId: null,
    conversations: [],
    activeId: null,
    sending: false,
    memoryOpen: false,
    selectedProvider: "local",

    bootstrap: () => {
      if (get().hydrated) return;
      const user = getSessionUser();
      const userId = user?.id ?? "anonymous";
      set({
        userId,
        conversations: loadAssistantSnapshot(userId),
        hydrated: true,
      });
    },

    setActiveId: (id) => set({ activeId: id }),
    setMemoryOpen: (open) => set({ memoryOpen: open }),
    setSelectedProvider: (provider) => set({ selectedProvider: provider }),

    createConversation: () => {
      const id = nanoid();
      const stamp = nowIso();
      const conversation: Conversation = {
        id,
        title: "گفتگوی جدید",
        createdAt: stamp,
        updatedAt: stamp,
        messages: [],
      };
      set((state) => ({
        conversations: [conversation, ...state.conversations],
        activeId: id,
        memoryOpen: false,
      }));
      persist();
      return id;
    },

    deleteConversation: (id) => {
      set((state) => ({
        conversations: state.conversations.filter(
          (conversation) => conversation.id !== id,
        ),
        activeId: state.activeId === id ? null : state.activeId,
      }));
      persist();
    },

    sendMessage: async (content) => {
      const text = content.replace(/\s+/g, " ").trim();
      if (!text || get().sending) return get().activeId;

      let conversationId = get().activeId;
      if (!conversationId) {
        conversationId = get().createConversation();
      }

      const userMessage: ChatMessage = {
        id: nanoid(),
        role: "user",
        content: text,
        createdAt: nowIso(),
      };
      const assistantId = nanoid();
      const assistantMessage: ChatMessage = {
        id: assistantId,
        role: "assistant",
        content: "",
        createdAt: nowIso(),
      };

      patchConversation(conversationId, (conversation) => ({
        ...conversation,
        title:
          conversation.messages.length === 0
            ? titleFromQuery(text)
            : conversation.title,
        updatedAt: nowIso(),
        messages: [...conversation.messages, userMessage, assistantMessage],
      }));

      set({ sending: true, memoryOpen: false });

      const provider = get().selectedProvider;
      let active = true;
      let sources: KnowledgeSource[] = [];
      let model = assistantProviderChoice(provider);
      let answer = "";

      const applyTrace = (
        nextSources: KnowledgeSource[],
        nextModel: AssistantModelChoice,
      ) => {
        if (!active) return;
        patchConversation(conversationId, (conversation) => ({
          ...conversation,
          updatedAt: nowIso(),
          messages: conversation.messages.map((message) =>
            message.id === assistantId
              ? {
                  ...message,
                  trace: {
                    suggestedKnowledge: nextSources,
                    suggestedModel: nextModel,
                    usedModel: nextModel,
                    retrievalNote: retrievalNoteFor(nextSources.length),
                  },
                }
              : message,
          ),
        }));
      };

      const applyContent = (value: string) => {
        if (!active) return;
        set((state) => ({
          conversations: state.conversations.map((conversation) =>
            conversation.id === conversationId
              ? {
                  ...conversation,
                  messages: conversation.messages.map((message) =>
                    message.id === assistantId
                      ? { ...message, content: value }
                      : message,
                  ),
                }
              : conversation,
          ),
        }));
      };

      try {
        if (provider === "search") {
          const result = await searchRag(text);
          sources = knowledgeFromSearchHits(result.results);
          applyTrace(sources, model);
          applyContent(composeSearchAnswer(text, result));
        } else {
          const searchTask = searchRag(text)
            .then((result) => {
              if (!active) return;
              const next = knowledgeFromSearchHits(result.results);
              if (next.length === 0 && sources.length > 0) return;
              sources = next;
              applyTrace(sources, model);
            })
            .catch(() => undefined);

          await streamRagChat({
            provider,
            query: text,
            onEvent: (event) => {
              if (event.type === "start") {
                model = assistantProviderChoice(provider, event.model);
                if (sources.length > 0) applyTrace(sources, model);
                return;
              }
              if (event.type === "context" && sources.length === 0) {
                sources = knowledgeFromContextSources(event.sources ?? []);
                applyTrace(sources, model);
                return;
              }
              if (event.type === "token") {
                answer += event.text ?? "";
                applyContent(answer);
              }
            },
          });
          await searchTask;
          if (!answer.trim()) {
            applyContent("پاسخی از مدل دریافت نشد.");
          }
        }
        persist();
      } catch (error) {
        active = false;
        const detail =
          error instanceof Error ? error.message : "پاسخ این نوبت ثبت نشد.";
        patchConversation(conversationId, (conversation) => ({
          ...conversation,
          updatedAt: nowIso(),
          messages: conversation.messages.map((message) =>
            message.id === assistantId
              ? {
                  ...message,
                  content: `پاسخ این نوبت کامل نشد. ${detail}`,
                }
              : message,
          ),
        }));
      } finally {
        set({ sending: false });
      }

      return conversationId;
    },
  };
});
