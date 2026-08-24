import type { AssistantMode } from "@/features/assistant/lib/rag";
import type { AssistantModelChoice } from "@/features/assistant/types";

export const ASSISTANT_CHAT_PROVIDERS: {
  id: AssistantMode;
  label: string;
}[] = [
  { id: "local", label: "مدل محلی" },
  { id: "external", label: "مدل خارجی" },
  { id: "search", label: "جستجو دانش" },
];

export function assistantProviderChoice(
  provider: AssistantMode,
  modelName?: string,
): AssistantModelChoice {
  if (provider === "search") {
    return {
      id: "search",
      name: "rag-search",
      label: "جستجو دانش",
      reason: "نتایج جستجوی دانش سازمانی",
    };
  }

  const label = provider === "local" ? "مدل محلی" : "مدل خارجی";
  const name =
    modelName?.trim() || (provider === "local" ? "local_llm" : "openai");
  return {
    id: provider,
    name,
    label,
    reason: `پاسخ با ${label}`,
  };
}
