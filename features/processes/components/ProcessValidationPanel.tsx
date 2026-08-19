"use client";

import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useProcessStore } from "@/features/processes/hooks/use-process-store";

type ProcessValidationPanelProps = {
  onFocus: (nodeId?: string, edgeId?: string) => void;
};

export function ProcessValidationPanel({ onFocus }: ProcessValidationPanelProps) {
  const issues = useProcessStore((s) => s.issues);
  const validationOpen = useProcessStore((s) => s.validationOpen);
  const setValidationOpen = useProcessStore((s) => s.setValidationOpen);

  if (!validationOpen) return null;

  return (
    <div className="absolute end-3 top-3 z-20 w-72 rounded-md border border-border bg-surface">
      <div className="flex items-center justify-between border-b border-border px-3 py-2">
        <p className="text-sm font-medium">نتایج اعتبارسنجی</p>
        <Button variant="ghost" size="sm" onClick={() => setValidationOpen(false)}>
          بستن
        </Button>
      </div>
      <ScrollArea className="max-h-64">
        <div className="space-y-1 p-2">
          {issues.length === 0 ? (
            <p className="px-2 py-3 text-xs text-muted-foreground">
              مشکل ساختاری یافت نشد.
            </p>
          ) : (
            issues.map((issue) => (
              <button
                key={issue.id}
                type="button"
                className="block w-full rounded-md px-2 py-1.5 text-start text-xs transition-colors duration-150 hover:bg-interactive hover:text-interactive-foreground"
                onClick={() => onFocus(issue.nodeId, issue.edgeId)}
              >
                <span
                  className={
                    issue.severity === "error"
                      ? "text-destructive"
                      : "text-amber-700 dark:text-amber-300"
                  }
                >
                  {issue.severity === "error" ? "خطا" : "هشدار"}
                </span>
                <span className="mt-0.5 block text-foreground">{issue.message}</span>
              </button>
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
