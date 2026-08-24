"use client";

import { useParams } from "next/navigation";

import { AssistantWorkspace } from "@/features/assistant/components/assistant-workspace";

export default function AssistantConversationPage() {
  const params = useParams<{ conversationId: string }>();
  return <AssistantWorkspace conversationId={params.conversationId} />;
}
