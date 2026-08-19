import type {
  ProcessDocument,
  ProcessValidationIssue,
} from "@/features/processes/types/process.types";

function wouldCreateCycle(
  edges: ProcessDocument["edges"],
  source: string,
  target: string,
): boolean {
  const adjacency = new Map<string, string[]>();
  for (const edge of edges) {
    const list = adjacency.get(edge.source) ?? [];
    list.push(edge.target);
    adjacency.set(edge.source, list);
  }
  const stack = [target];
  const seen = new Set<string>();
  while (stack.length > 0) {
    const current = stack.pop()!;
    if (current === source) return true;
    if (seen.has(current)) continue;
    seen.add(current);
    for (const next of adjacency.get(current) ?? []) {
      stack.push(next);
    }
  }
  return false;
}

export function canConnect(params: {
  source?: string | null;
  target?: string | null;
  sourceHandle?: string | null;
  edges: ProcessDocument["edges"];
  nodes: ProcessDocument["nodes"];
  preventCycles: boolean;
}): boolean {
  const { source, target, nodes, edges, preventCycles } = params;
  if (!source || !target || source === target) return false;

  const sourceNode = nodes.find((node) => node.id === source);
  const targetNode = nodes.find((node) => node.id === target);
  if (!sourceNode || !targetNode) return false;
  if (sourceNode.data.objectType === "end") return false;
  if (targetNode.data.objectType === "start") return false;

  if (preventCycles && wouldCreateCycle(edges, source, target)) {
    return false;
  }

  return true;
}

export function validateProcess(
  process: ProcessDocument,
): ProcessValidationIssue[] {
  const issues: ProcessValidationIssue[] = [];
  const starts = process.nodes.filter((node) => node.data.objectType === "start");
  const ends = process.nodes.filter((node) => node.data.objectType === "end");

  if (starts.length === 0) {
    issues.push({
      id: "missing-start",
      severity: "error",
      message: "فرآیند فاقد گره شروع است.",
    });
  }
  if (starts.length > 1) {
    issues.push({
      id: "multiple-start",
      severity: "error",
      message: "فقط یک گره شروع مجاز است.",
      nodeId: starts[1]?.id,
    });
  }
  if (ends.length === 0) {
    issues.push({
      id: "missing-end",
      severity: "warning",
      message: "فرآیند فاقد گره پایان است.",
    });
  }

  const connected = new Set<string>();
  for (const edge of process.edges) {
    connected.add(edge.source);
    connected.add(edge.target);
  }

  for (const node of process.nodes) {
    if (!node.data.title.trim()) {
      issues.push({
        id: `empty-title-${node.id}`,
        severity: "error",
        message: "عنوان گره خالی است.",
        nodeId: node.id,
      });
    }

    if (
      node.data.objectType !== "start" &&
      node.data.objectType !== "note" &&
      node.data.objectType !== "label" &&
      !connected.has(node.id) &&
      process.nodes.length > 1
    ) {
      issues.push({
        id: `disconnected-${node.id}`,
        severity: "warning",
        message: `گره «${node.data.title}» متصل نیست.`,
        nodeId: node.id,
      });
    }

    if (
      node.data.objectType === "decision" &&
      (node.data.branches?.length ?? 0) < 2
    ) {
      issues.push({
        id: `decision-branches-${node.id}`,
        severity: "error",
        message: `تصمیم «${node.data.title}» باید حداقل دو شاخه داشته باشد.`,
        nodeId: node.id,
      });
    }

    if (
      node.data.objectType === "subprocess" &&
      !node.data.relatedProcessId
    ) {
      issues.push({
        id: `subprocess-ref-${node.id}`,
        severity: "warning",
        message: `فرآیند فرعی «${node.data.title}» به فرآیندی ارجاع نشده است.`,
        nodeId: node.id,
      });
    }
  }

  return issues;
}
