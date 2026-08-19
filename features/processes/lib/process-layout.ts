import type { ProcessDocument } from "@/features/processes/types/process.types";

type ElkNode = {
  id: string;
  width?: number;
  height?: number;
  x?: number;
  y?: number;
};

type ElkEdge = {
  id: string;
  sources: string[];
  targets: string[];
};

type ElkGraph = {
  id: string;
  layoutOptions: Record<string, string>;
  children: ElkNode[];
  edges: ElkEdge[];
};

export async function layoutProcess(
  process: ProcessDocument,
  direction: "horizontal" | "vertical" = "horizontal",
): Promise<ProcessDocument> {
  const ELK = (await import("elkjs/lib/elk.bundled.js")).default;
  const elk = new ELK();

  const graph: ElkGraph = {
    id: "root",
    layoutOptions: {
      "elk.algorithm": "layered",
      "elk.direction": direction === "horizontal" ? "RIGHT" : "DOWN",
      "elk.spacing.nodeNode": "48",
      "elk.layered.spacing.nodeNodeBetweenLayers": "72",
    },
    children: process.nodes.map((node) => ({
      id: node.id,
      width: node.width ?? 180,
      height: node.height ?? 72,
    })),
    edges: process.edges.map((edge) => ({
      id: edge.id,
      sources: [edge.source],
      targets: [edge.target],
    })),
  };

  const layouted = (await elk.layout(graph)) as ElkGraph & {
    children?: Array<ElkNode & { x?: number; y?: number }>;
  };

  const positions = new Map(
    (layouted.children ?? []).map((child) => [
      child.id,
      { x: child.x ?? 0, y: child.y ?? 0 },
    ]),
  );

  return {
    ...process,
    nodes: process.nodes.map((node) => ({
      ...node,
      position: positions.get(node.id) ?? node.position,
    })),
    settings: {
      ...process.settings,
      layoutDirection: direction,
    },
  };
}
