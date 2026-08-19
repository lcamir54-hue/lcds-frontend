"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import * as React from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import { useProcessStore } from "@/features/processes/hooks/use-process-store";
import type { ProcessEdge, ProcessNode } from "@/features/processes/types/process.types";

const nodeFormSchema = z.object({
  title: z.string().min(1, "عنوان الزامی است"),
  description: z.string(),
  status: z.enum([
    "default",
    "completed",
    "in-progress",
    "warning",
    "error",
    "disabled",
  ]),
  assignee: z.string(),
  role: z.string(),
  department: z.string(),
  duration: z.string(),
  input: z.string(),
  output: z.string(),
  conditions: z.string(),
  notes: z.string(),
  color: z.string(),
  locked: z.boolean(),
});

const edgeFormSchema = z.object({
  label: z.string(),
  type: z.enum(["default", "smoothstep", "straight", "bezier"]),
  condition: z.string(),
  color: z.string(),
  animated: z.boolean(),
});

type ProcessPropertiesPanelProps = {
  onClose: () => void;
};

export function ProcessPropertiesPanel({ onClose }: ProcessPropertiesPanelProps) {
  const process = useProcessStore((s) => s.process);
  const selectedNodeIds = useProcessStore((s) => s.selectedNodeIds);
  const selectedEdgeIds = useProcessStore((s) => s.selectedEdgeIds);
  const setProcess = useProcessStore((s) => s.setProcess);

  const selectedNode = process?.nodes.find((node) => node.id === selectedNodeIds[0]);
  const selectedEdge = process?.edges.find((edge) => edge.id === selectedEdgeIds[0]);

  if (!process || (!selectedNode && !selectedEdge)) {
    return null;
  }

  return (
    <aside className="flex h-full w-[280px] shrink-0 flex-col border-s border-border bg-sidebar">
      <div className="flex h-12 items-center justify-between border-b border-border px-3">
        <p className="text-sm font-medium">
          {selectedNode ? "ویژگی‌های گره" : "ویژگی‌های اتصال"}
        </p>
        <Button variant="ghost" size="sm" onClick={onClose}>
          بستن
        </Button>
      </div>
      <ScrollArea className="flex-1 p-3">
        {selectedNode ? (
          <NodePropertiesForm
            key={selectedNode.id}
            node={selectedNode}
            onChange={(nextNode) => {
              setProcess({
                ...process,
                nodes: process.nodes.map((node) =>
                  node.id === nextNode.id ? nextNode : node,
                ),
              });
            }}
          />
        ) : null}
        {selectedEdge && !selectedNode ? (
          <EdgePropertiesForm
            key={selectedEdge.id}
            edge={selectedEdge}
            onChange={(nextEdge) => {
              setProcess({
                ...process,
                edges: process.edges.map((edge) =>
                  edge.id === nextEdge.id ? nextEdge : edge,
                ),
              });
            }}
            onDelete={() => {
              setProcess({
                ...process,
                edges: process.edges.filter((edge) => edge.id !== selectedEdge.id),
              });
            }}
          />
        ) : null}
      </ScrollArea>
    </aside>
  );
}

function NodePropertiesForm({
  node,
  onChange,
}: {
  node: ProcessNode;
  onChange: (node: ProcessNode) => void;
}) {
  const form = useForm<z.infer<typeof nodeFormSchema>>({
    resolver: zodResolver(nodeFormSchema),
    defaultValues: {
      title: node.data.title,
      description: node.data.description ?? "",
      status: node.data.status,
      assignee: node.data.assignee ?? "",
      role: node.data.role ?? "",
      department: node.data.department ?? "",
      duration: node.data.duration ?? "",
      input: node.data.input ?? "",
      output: node.data.output ?? "",
      conditions: node.data.conditions ?? "",
      notes: node.data.notes ?? "",
      color: node.data.color ?? "",
      locked: node.data.locked ?? false,
    },
  });

  React.useEffect(() => {
    const subscription = form.watch((values) => {
      onChange({
        ...node,
        data: {
          ...node.data,
          ...values,
          title: values.title ?? node.data.title,
        },
      });
    });
    return () => subscription.unsubscribe();
  }, [form, node, onChange]);

  return (
    <div className="space-y-3">
      <Field label="عنوان">
        <Input {...form.register("title")} />
      </Field>
      <Field label="توضیحات">
        <Textarea className="min-h-16" {...form.register("description")} />
      </Field>
      <Field label="وضعیت">
        <select
          className="h-8 w-full rounded-md border border-border bg-surface px-2 text-sm"
          {...form.register("status")}
        >
          <option value="default">پیش‌فرض</option>
          <option value="in-progress">در حال انجام</option>
          <option value="completed">تکمیل‌شده</option>
          <option value="warning">هشدار</option>
          <option value="error">خطا</option>
          <option value="disabled">غیرفعال</option>
        </select>
      </Field>
      <Field label="مسئول اجرا">
        <Input {...form.register("assignee")} />
      </Field>
      <Field label="نقش سازمانی">
        <Input {...form.register("role")} />
      </Field>
      <Field label="واحد سازمانی">
        <Input {...form.register("department")} />
      </Field>
      <Field label="مدت تخمینی">
        <Input {...form.register("duration")} />
      </Field>
      <Field label="ورودی موردنیاز">
        <Input {...form.register("input")} />
      </Field>
      <Field label="خروجی مورد انتظار">
        <Input {...form.register("output")} />
      </Field>
      <Field label="شرایط">
        <Textarea className="min-h-14" {...form.register("conditions")} />
      </Field>
      <Field label="یادداشت">
        <Textarea className="min-h-14" {...form.register("notes")} />
      </Field>
    </div>
  );
}

function EdgePropertiesForm({
  edge,
  onChange,
  onDelete,
}: {
  edge: ProcessEdge;
  onChange: (edge: ProcessEdge) => void;
  onDelete: () => void;
}) {
  const form = useForm<z.infer<typeof edgeFormSchema>>({
    resolver: zodResolver(edgeFormSchema),
    defaultValues: {
      label: String(edge.label ?? ""),
      type: edge.type ?? "smoothstep",
      condition: edge.data?.condition ?? "",
      color: edge.data?.color ?? "",
      animated: edge.animated ?? false,
    },
  });

  React.useEffect(() => {
    const subscription = form.watch((values) => {
      onChange({
        ...edge,
        label: values.label ?? "",
        type: values.type ?? "smoothstep",
        animated: Boolean(values.animated),
        style: {
          ...edge.style,
          stroke: values.color || edge.style?.stroke,
        },
        data: {
          condition: values.condition ?? "",
          color: values.color ?? "",
          arrowStyle: edge.data?.arrowStyle ?? "arrowclosed",
        },
      });
    });
    return () => subscription.unsubscribe();
  }, [edge, form, onChange]);

  return (
    <div className="space-y-3">
      <Field label="برچسب">
        <Input {...form.register("label")} placeholder="بله / خیر / ادامه" />
      </Field>
      <Field label="نوع اتصال">
        <select
          className="h-8 w-full rounded-md border border-border bg-surface px-2 text-sm"
          {...form.register("type")}
        >
          <option value="smoothstep">پله‌ای نرم</option>
          <option value="straight">مستقیم</option>
          <option value="bezier">منحنی</option>
          <option value="default">پیش‌فرض</option>
        </select>
      </Field>
      <Field label="شرط">
        <Input {...form.register("condition")} />
      </Field>
      <Field label="رنگ">
        <Input {...form.register("color")} placeholder="#64748b" />
      </Field>
      <label className="flex items-center gap-2 text-xs">
        <input type="checkbox" {...form.register("animated")} />
        اتصال متحرک
      </label>
      <Button variant="destructive" size="sm" onClick={onDelete}>
        حذف اتصال
      </Button>
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1">
      <Label className="text-xs">{label}</Label>
      {children}
    </div>
  );
}
