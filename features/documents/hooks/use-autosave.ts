"use client";

import * as React from "react";

import { useWorkspaceStore } from "@/features/documents/hooks/use-workspace-store";

export function useAutosave(delayMs = 800) {
  const isDirty = useWorkspaceStore((s) => s.isDirty);
  const saveActive = useWorkspaceStore((s) => s.saveActive);
  const markdown = useWorkspaceStore((s) => s.markdown);
  const activeId = useWorkspaceStore((s) => s.activeId);

  React.useEffect(() => {
    if (!isDirty || !activeId) return;

    const timer = window.setTimeout(() => {
      void saveActive();
    }, delayMs);

    return () => window.clearTimeout(timer);
  }, [isDirty, markdown, activeId, delayMs, saveActive]);
}

export function useUnsavedChangesWarning() {
  const isDirty = useWorkspaceStore((s) => s.isDirty);

  React.useEffect(() => {
    const onBeforeUnload = (event: BeforeUnloadEvent) => {
      if (!isDirty) return;
      event.preventDefault();
      event.returnValue = "";
    };

    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [isDirty]);
}
