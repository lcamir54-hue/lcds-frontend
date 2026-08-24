import {
  assistantSnapshotSchema,
  type AssistantSnapshot,
  type Conversation,
} from "@/features/assistant/types";
import { ASSISTANT_STORAGE_KEY } from "@/lib/constants";

function keyFor(userId: string) {
  return `${ASSISTANT_STORAGE_KEY}:${userId}`;
}

export function loadAssistantSnapshot(userId: string): Conversation[] {
  if (typeof window === "undefined") return [];
  const raw = window.localStorage.getItem(keyFor(userId));
  if (!raw) return [];
  try {
    const parsed = assistantSnapshotSchema.parse(JSON.parse(raw));
    return parsed.conversations.sort(
      (a, b) => Date.parse(b.updatedAt) - Date.parse(a.updatedAt),
    );
  } catch {
    return [];
  }
}

export function saveAssistantSnapshot(
  userId: string,
  conversations: Conversation[],
) {
  if (typeof window === "undefined") return;
  const snapshot: AssistantSnapshot = {
    version: 1,
    conversations,
  };
  window.localStorage.setItem(keyFor(userId), JSON.stringify(snapshot));
}
