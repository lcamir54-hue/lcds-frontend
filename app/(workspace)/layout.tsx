import type { ReactNode } from "react";

import { KnowledgeShell } from "@/features/documents/components/knowledge-shell";

export default function WorkspaceLayout({
  children,
}: {
  children: ReactNode;
}) {
  return <KnowledgeShell>{children}</KnowledgeShell>;
}
