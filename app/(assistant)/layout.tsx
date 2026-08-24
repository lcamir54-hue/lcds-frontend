import type { Metadata } from "next";
import type { ReactNode } from "react";

import { AssistantShell } from "@/features/assistant/components/assistant-shell";

export const metadata: Metadata = {
  title: "دستیار دانش سازمانی",
};

export default function AssistantLayout({ children }: { children: ReactNode }) {
  return <AssistantShell>{children}</AssistantShell>;
}
