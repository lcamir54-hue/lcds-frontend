"use client";

import { Handle, type Node, type NodeProps, Position, useReactFlow } from "@xyflow/react";
import { X } from "lucide-react";
import * as React from "react";

import { findLibraryItem } from "@/features/processes/lib/process-library";
import type { ProcessNodeData } from "@/features/processes/types/process.types";
import { cn } from "@/lib/utils";

type ProcessFlowNodeType = Node<ProcessNodeData, "process">;

const COLOR_MAP: Record<string, string> = {
  green:
    "border-emerald-300 bg-emerald-50 text-emerald-950 dark:border-emerald-700 dark:bg-emerald-950/45 dark:text-emerald-100",
  red: "border-red-300 bg-red-50 text-red-950 dark:border-red-800 dark:bg-red-950/45 dark:text-red-100",
  amber:
    "border-amber-300 bg-amber-50 text-amber-950 dark:border-amber-700 dark:bg-amber-950/45 dark:text-amber-100",
  blue: "border-sky-300 bg-sky-50 text-sky-950 dark:border-sky-700 dark:bg-sky-950/45 dark:text-sky-100",
  purple:
    "border-violet-300 bg-violet-50 text-violet-950 dark:border-violet-700 dark:bg-violet-950/45 dark:text-violet-100",
  neutral: "border-border bg-surface text-foreground",
};

const STATUS_RING: Record<string, string> = {
  completed: "ring-1 ring-emerald-400",
  "in-progress": "ring-1 ring-sky-400",
  warning: "ring-1 ring-amber-400",
  error: "ring-1 ring-red-400",
  disabled: "opacity-50",
  default: "",
};

export const ProcessFlowNode = React.memo(function ProcessFlowNode({
  id,
  data,
  selected,
}: NodeProps<ProcessFlowNodeType>) {
  const { deleteElements } = useReactFlow();
  const item = findLibraryItem(data.objectType);
  const color = item?.color ?? "neutral";
  const isStart = data.objectType === "start";
  const isEnd = data.objectType === "end";
  const isDecision = data.objectType === "decision";

  return (
    <div
      className={cn(
        "group relative min-w-[150px] max-w-[200px] rounded-md border px-2.5 py-2 shadow-none",
        COLOR_MAP[color] ?? COLOR_MAP.neutral,
        selected &&
          "border-interactive-ring bg-interactive-selected ring-1 ring-interactive-ring",
        STATUS_RING[data.status] ?? "",
        isDecision && "rounded-lg",
      )}
      aria-label={data.title}
    >
      <button
        type="button"
        className={cn(
          "nodrag nopan absolute -top-2 -end-2 z-10 flex size-5 items-center justify-center rounded-full border border-border bg-background text-muted-foreground opacity-0 transition-opacity hover:bg-destructive hover:text-destructive-foreground group-hover:opacity-100",
          selected && "opacity-100",
        )}
        aria-label={`حذف ${data.title}`}
        onClick={(event) => {
          event.stopPropagation();
          event.preventDefault();
          deleteElements({ nodes: [{ id }] });
        }}
      >
        <X className="size-3" aria-hidden />
      </button>

      {!isStart ? (
        <Handle
          type="target"
          position={Position.Left}
          className="!size-2.5 !border-border !bg-foreground"
        />
      ) : null}

      <div className="flex items-start gap-2">
        <span className="mt-0.5 text-sm" aria-hidden>
          {data.icon ?? item?.icon}
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-xs font-medium" dir="auto">
            {data.title}
          </p>
          {data.description ? (
            <p
              className="mt-0.5 line-clamp-2 text-[10px] text-muted-foreground"
              dir="auto"
            >
              {data.description}
            </p>
          ) : null}
          {data.assignee || data.role ? (
            <p className="mt-1 text-[10px] text-muted-foreground" dir="auto">
              {[data.role, data.assignee].filter(Boolean).join(" · ")}
            </p>
          ) : null}
        </div>
      </div>

      {!isEnd ? (
        isDecision ? (
          (data.branches?.length ? data.branches : ["بله", "خیر"]).map(
            (branch, index) => (
              <Handle
                key={`${branch}-${index}`}
                id={`branch-${index}`}
                type="source"
                position={Position.Right}
                style={{ top: `${35 + index * 22}%` }}
                className="!size-2.5 !border-border !bg-foreground"
              />
            ),
          )
        ) : (
          <Handle
            type="source"
            position={Position.Right}
            className="!size-2.5 !border-border !bg-foreground"
          />
        )
      ) : null}
    </div>
  );
});
