import { useWorkspaceStore } from "@/features/documents/hooks/use-workspace-store";
import { useProcessStore } from "@/features/processes/hooks/use-process-store";

export function hasUnsavedChanges() {
  return (
    useWorkspaceStore.getState().isDirty || useProcessStore.getState().isDirty
  );
}

export function discardUnsavedChanges() {
  if (useWorkspaceStore.getState().isDirty) {
    useWorkspaceStore.setState({ isDirty: false, saveStatus: "idle" });
  }
  if (useProcessStore.getState().isDirty) {
    useProcessStore.setState({ isDirty: false, saveStatus: "idle" });
  }
}

export async function saveUnsavedChanges() {
  const workspace = useWorkspaceStore.getState();
  if (workspace.isDirty) {
    await workspace.saveActive();
    if (useWorkspaceStore.getState().isDirty) return false;
  }

  const process = useProcessStore.getState();
  if (process.isDirty) {
    await process.save();
    if (useProcessStore.getState().isDirty) return false;
  }

  return true;
}
