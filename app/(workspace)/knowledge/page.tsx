"use client";

import { useRouter } from "next/navigation";
import * as React from "react";

import { KnowledgeHome } from "@/features/documents/components/knowledge-views";
import { useWorkspaceStore } from "@/features/documents/hooks/use-workspace-store";
import { knowledgeItemHref } from "@/features/documents/lib/knowledge-routes";

export default function KnowledgeIndexPage() {
  const router = useRouter();
  const hydrated = useWorkspaceStore((s) => s.hydrated);
  const items = useWorkspaceStore((s) => s.items);

  React.useEffect(() => {
    if (!hydrated) return;
    const first = items.find(
      (item) => item.kind === "page" || item.kind === "process",
    );
    if (!first) return;
    const href = knowledgeItemHref(first);
    if (href) router.replace(href);
  }, [hydrated, items, router]);

  return <KnowledgeHome />;
}
