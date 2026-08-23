"use client";

import "@xyflow/react/dist/style.css";

import {
  addEdge,
  Background,
  BackgroundVariant,
  type Connection,
  Controls,
  type Edge,
  MarkerType,
  MiniMap,
  type Node,
  type NodeChange,
  type OnSelectionChangeParams,
  ReactFlow,
  ReactFlowProvider,
  SelectionMode,
  useEdgesState,
  useNodesState,
  useReactFlow,
} from "@xyflow/react";
import { toPng } from "html-to-image";
import { nanoid } from "nanoid";
import * as React from "react";

import type { PublishStatus } from "@/features/documents/types";
import { ProcessEdge } from "@/features/processes/components/edges/ProcessEdge";
import { ProcessFlowNode } from "@/features/processes/components/nodes/ProcessFlowNode";
import { ProcessObjectLibrary } from "@/features/processes/components/ProcessObjectLibrary";
import { ProcessPropertiesPanel } from "@/features/processes/components/ProcessPropertiesPanel";
import { ProcessToolbar } from "@/features/processes/components/ProcessToolbar";
import { ProcessValidationPanel } from "@/features/processes/components/ProcessValidationPanel";
import { useProcessStore } from "@/features/processes/hooks/use-process-store";
import { createProcessNode } from "@/features/processes/lib/process-factory";
import { layoutProcess } from "@/features/processes/lib/process-layout";
import { findLibraryItem } from "@/features/processes/lib/process-library";
import { canConnect } from "@/features/processes/lib/process-validation";
import { apiProcessRepository } from "@/features/processes/repositories/api-process-repository";
import type {
  ProcessDocument,
  ProcessObjectType,
} from "@/features/processes/types/process.types";

const nodeTypes = { process: ProcessFlowNode };
const edgeTypes = { process: ProcessEdge };

function mergeById<T extends { id: string }>(current: T[], incoming: T[]): T[] {
  const incomingById = new Map(incoming.map((item) => [item.id, item]));
  const seen = new Set<string>();
  const merged: T[] = [];

  for (const item of current) {
    const next = incomingById.get(item.id);
    if (next) {
      merged.push(next);
      seen.add(item.id);
    } else {
      merged.push(item);
    }
  }

  for (const item of incoming) {
    if (seen.has(item.id)) continue;
    merged.push(item);
  }

  return merged;
}

function toProcessNodes(nodes: Node[]): ProcessDocument["nodes"] {
  return nodes.map((node) => ({
    id: node.id,
    type: (node.type as ProcessDocument["nodes"][number]["type"]) ?? "process",
    position: node.position,
    width: node.width ?? undefined,
    height: node.height ?? undefined,
    data: node.data as ProcessDocument["nodes"][number]["data"],
  }));
}

function toProcessEdges(edges: Edge[]): ProcessDocument["edges"] {
  return edges.map((edge) => ({
    id: edge.id,
    source: edge.source,
    target: edge.target,
    sourceHandle: edge.sourceHandle,
    targetHandle: edge.targetHandle,
    type: (edge.type as ProcessDocument["edges"][number]["type"]) ?? "smoothstep",
    label: typeof edge.label === "string" ? edge.label : "",
    animated: Boolean(edge.animated),
    style: edge.style as { stroke?: string } | undefined,
    data: edge.data as ProcessDocument["edges"][number]["data"],
  }));
}

type ProcessDesignerProps = {
  processId: string;
  topicId: string;
  topicTitle: string;
  processTitle: string;
  processIcon?: string;
  readOnly?: boolean;
  onDeleted: () => void;
  onDuplicated: (id: string) => void;
  onTitleChange: (title: string) => void;
  onStatusChange: (status: PublishStatus) => void;
};

function ProcessDesignerInner({
  processId,
  topicId,
  topicTitle,
  processTitle,
  processIcon,
  readOnly = false,
  onDeleted,
  onDuplicated,
  onTitleChange,
  onStatusChange,
}: ProcessDesignerProps) {
  const process = useProcessStore((s) => s.process);
  const saveStatus = useProcessStore((s) => s.saveStatus);
  const viewMode = useProcessStore((s) => s.viewMode);
  const load = useProcessStore((s) => s.load);
  const setProcess = useProcessStore((s) => s.setProcess);
  const save = useProcessStore((s) => s.save);
  const validate = useProcessStore((s) => s.validate);
  const setSelection = useProcessStore((s) => s.setSelection);
  const undo = useProcessStore((s) => s.undo);
  const redo = useProcessStore((s) => s.redo);
  const reset = useProcessStore((s) => s.reset);

  const {
    fitView,
    zoomIn,
    zoomOut,
    setCenter,
    screenToFlowPosition,
    getNodes,
    getEdges,
  } = useReactFlow();
  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
  const [propsOpen, setPropsOpen] = React.useState(false);
  const [mobileLibraryOpen, setMobileLibraryOpen] = React.useState(false);
  const [clipboard, setClipboard] = React.useState<{
    nodes: Node[];
    edges: Edge[];
  } | null>(null);
  const wrapperRef = React.useRef<HTMLDivElement>(null);
  const skipStoreSyncRef = React.useRef(false);
  const isDraggingRef = React.useRef(false);
  const hasFittedRef = React.useRef(false);

  React.useEffect(() => {
    void load(processId, {
      topicId,
      title: processTitle,
      icon: processIcon,
      readOnly,
    });
    hasFittedRef.current = false;
    return () => reset();
  }, [load, processIcon, processId, processTitle, readOnly, reset, topicId]);

  React.useEffect(() => {
    if (readOnly) {
      useProcessStore.getState().setViewMode("view");
    }
  }, [process, processId, readOnly]);

  React.useEffect(() => {
    if (!process) return;
    if (skipStoreSyncRef.current) {
      skipStoreSyncRef.current = false;
      return;
    }
    if (isDraggingRef.current) return;

    setNodes(
      process.nodes.map((node) => ({
        ...node,
        type: "process",
        draggable: viewMode === "design" && !node.data.locked,
        selectable: true,
        connectable: viewMode === "design",
      })) as Node[],
    );
    setEdges(
      process.edges.map((edge) => ({
        ...edge,
        type: "process",
        markerEnd: { type: MarkerType.ArrowClosed },
      })) as Edge[],
    );
  }, [process, setEdges, setNodes, viewMode]);

  const syncFromFlow = React.useCallback(
    (
      nextNodes: Node[],
      nextEdges: Edge[],
      options?: { recordHistory?: boolean; replace?: boolean },
    ) => {
      const current = useProcessStore.getState().process;
      if (!current) return;
      const recordHistory = options?.recordHistory ?? true;
      const mappedNodes = toProcessNodes(nextNodes);
      const mappedEdges = toProcessEdges(nextEdges);
      const next: ProcessDocument = {
        ...current,
        nodes: options?.replace
          ? mappedNodes
          : mergeById(current.nodes, mappedNodes),
        edges: options?.replace
          ? mappedEdges
          : mergeById(current.edges, mappedEdges),
      };
      skipStoreSyncRef.current = true;
      setProcess(next, { recordHistory });
    },
    [setProcess],
  );

  const syncCurrentFlow = React.useCallback(
    (options?: { recordHistory?: boolean; replace?: boolean }) => {
      syncFromFlow(getNodes(), getEdges(), options);
    },
    [getEdges, getNodes, syncFromFlow],
  );

  const handleNodesChange = React.useCallback(
    (changes: NodeChange[]) => {
      if (isDraggingRef.current) {
        onNodesChange(changes.filter((change) => change.type !== "remove"));
        return;
      }
      onNodesChange(changes);
    },
    [onNodesChange],
  );

  const addObject = React.useCallback(
    (objectType: ProcessObjectType, position?: { x: number; y: number }) => {
      if (!process || viewMode !== "design") return;
      const item = findLibraryItem(objectType);
      const flowPos =
        position ??
        screenToFlowPosition({
          x: window.innerWidth / 2,
          y: window.innerHeight / 2,
        });
      const created = createProcessNode(objectType, flowPos, item?.label);
      const nextNodes = [
        ...getNodes(),
        {
          ...created,
          type: "process",
        } as Node,
      ];
      setNodes(nextNodes);
      syncFromFlow(nextNodes, getEdges());
    },
    [getEdges, getNodes, process, screenToFlowPosition, setNodes, syncFromFlow, viewMode],
  );

  const onConnect = React.useCallback(
    (connection: Connection) => {
      if (!process || viewMode !== "design") return;
      if (
        !canConnect({
          source: connection.source,
          target: connection.target,
          sourceHandle: connection.sourceHandle,
          edges: process.edges,
          nodes: process.nodes,
          preventCycles: process.settings.preventCycles,
        })
      ) {
        return;
      }
      const currentNodes = getNodes();
      const currentEdges = getEdges();
      const nextEdges = addEdge(
        {
          ...connection,
          id: nanoid(8),
          type: "process",
          markerEnd: { type: MarkerType.ArrowClosed },
          label:
            connection.sourceHandle?.startsWith("branch-") &&
            process.nodes.find((node) => node.id === connection.source)?.data
              .branches?.[Number(connection.sourceHandle.split("-")[1] ?? 0)]
              ? process.nodes.find((node) => node.id === connection.source)?.data
                  .branches?.[Number(connection.sourceHandle.split("-")[1] ?? 0)]
              : "",
        },
        currentEdges,
      );
      setEdges(nextEdges);
      syncFromFlow(currentNodes, nextEdges);
    },
    [getEdges, getNodes, process, setEdges, syncFromFlow, viewMode],
  );

  const onSelectionChange = React.useCallback(
    ({ nodes: selectedNodes, edges: selectedEdges }: OnSelectionChangeParams) => {
      setSelection(
        selectedNodes.map((node) => node.id),
        selectedEdges.map((edge) => edge.id),
      );
      setPropsOpen(selectedNodes.length === 1 || selectedEdges.length === 1);
    },
    [setSelection],
  );

  React.useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.isContentEditable)
      ) {
        return;
      }

      const meta = event.metaKey || event.ctrlKey;
      const canMutate = viewMode === "design" && !readOnly;
      if (meta && event.key.toLowerCase() === "z" && !event.shiftKey) {
        if (!canMutate) return;
        event.preventDefault();
        undo();
      }
      if (meta && event.key.toLowerCase() === "z" && event.shiftKey) {
        if (!canMutate) return;
        event.preventDefault();
        redo();
      }
      if (meta && event.key.toLowerCase() === "s") {
        if (!canMutate) return;
        event.preventDefault();
        void save();
      }
      if (meta && event.key.toLowerCase() === "a") {
        event.preventDefault();
        setNodes((current) => current.map((node) => ({ ...node, selected: true })));
        setEdges((current) => current.map((edge) => ({ ...edge, selected: true })));
      }
      if (meta && event.key.toLowerCase() === "c") {
        const currentNodes = getNodes();
        const currentEdges = getEdges();
        const selected = currentNodes.filter((node) => node.selected);
        if (selected.length === 0) return;
        const selectedIds = new Set(selected.map((node) => node.id));
        setClipboard({
          nodes: selected,
          edges: currentEdges.filter(
            (edge) => selectedIds.has(edge.source) && selectedIds.has(edge.target),
          ),
        });
      }
      if (meta && event.key.toLowerCase() === "x") {
        if (!canMutate) return;
        const currentNodes = getNodes();
        const currentEdges = getEdges();
        const selected = currentNodes.filter((node) => node.selected);
        if (selected.length === 0) return;
        const selectedIds = new Set(selected.map((node) => node.id));
        setClipboard({
          nodes: selected,
          edges: currentEdges.filter(
            (edge) => selectedIds.has(edge.source) && selectedIds.has(edge.target),
          ),
        });
        const nextNodes = currentNodes.filter((node) => !selectedIds.has(node.id));
        const nextEdges = currentEdges.filter(
          (edge) => !selectedIds.has(edge.source) && !selectedIds.has(edge.target),
        );
        setNodes(nextNodes);
        setEdges(nextEdges);
        syncFromFlow(nextNodes, nextEdges, { replace: true });
      }
      if (meta && event.key.toLowerCase() === "v" && clipboard) {
        if (!canMutate) return;
        const currentNodes = getNodes();
        const currentEdges = getEdges();
        const idMap = new Map<string, string>();
        const pastedNodes = clipboard.nodes.map((node) => {
          const id = nanoid(10);
          idMap.set(node.id, id);
          return {
            ...node,
            id,
            position: { x: node.position.x + 40, y: node.position.y + 40 },
            selected: true,
          };
        });
        const pastedEdges = clipboard.edges
          .map((edge) => {
            const source = idMap.get(edge.source);
            const target = idMap.get(edge.target);
            if (!source || !target) return null;
            return { ...edge, id: nanoid(8), source, target };
          })
          .filter(Boolean) as Edge[];
        const nextNodes = [
          ...currentNodes.map((node) => ({ ...node, selected: false })),
          ...pastedNodes,
        ];
        const nextEdges = [...currentEdges, ...pastedEdges];
        setNodes(nextNodes);
        setEdges(nextEdges);
        syncFromFlow(nextNodes, nextEdges);
      }
      if (meta && event.key.toLowerCase() === "d") {
        if (!canMutate) return;
        event.preventDefault();
        const currentNodes = getNodes();
        const selected = currentNodes.filter((node) => node.selected);
        if (selected.length === 0) return;
        const duplicated = selected.map((node) => ({
          ...node,
          id: nanoid(10),
          position: { x: node.position.x + 32, y: node.position.y + 32 },
          selected: true,
        }));
        const nextNodes = [
          ...currentNodes.map((node) => ({ ...node, selected: false })),
          ...duplicated,
        ];
        setNodes(nextNodes);
        syncFromFlow(nextNodes, getEdges());
      }
      if (event.key === "+" || event.key === "=") zoomIn();
      if (event.key === "-") zoomOut();
      if (event.key === "Escape") {
        setPropsOpen(false);
        setNodes((current) => current.map((node) => ({ ...node, selected: false })));
        setEdges((current) => current.map((edge) => ({ ...edge, selected: false })));
      }
      if (
        ["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(event.key) &&
        viewMode === "design"
      ) {
        const delta = event.shiftKey ? 20 : 5;
        const dx =
          event.key === "ArrowLeft" ? -delta : event.key === "ArrowRight" ? delta : 0;
        const dy =
          event.key === "ArrowUp" ? -delta : event.key === "ArrowDown" ? delta : 0;
        const currentNodes = getNodes();
        const nextNodes = currentNodes.map((node) =>
          node.selected
            ? {
                ...node,
                position: {
                  x: node.position.x + dx,
                  y: node.position.y + dy,
                },
              }
            : node,
        );
        setNodes(nextNodes);
        syncFromFlow(nextNodes, getEdges());
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [
    clipboard,
    getEdges,
    getNodes,
    redo,
    save,
    setEdges,
    setNodes,
    syncFromFlow,
    undo,
    viewMode,
    readOnly,
    zoomIn,
    zoomOut,
  ]);

  if (!process) {
    return (
      <div className="flex flex-1 items-center justify-center text-sm text-muted-foreground">
        {saveStatus === "error"
          ? "بارگذاری فرآیند ناموفق بود."
          : "در حال بارگذاری فرآیند…"}
      </div>
    );
  }

  const showLibrary = viewMode === "design" && !propsOpen;
  const showProps = viewMode === "design" && propsOpen;

  return (
    <div className="flex h-full min-h-0 flex-1 flex-col overflow-hidden">
      <ProcessToolbar
        topicTitle={topicTitle}
        readOnly={readOnly}
        onFitView={() => fitView({ padding: 0.2 })}
        onCenter={() => {
          const selected = getNodes().find((node) => node.selected);
          if (selected) {
            setCenter(selected.position.x, selected.position.y, { zoom: 1.1 });
          } else {
            fitView({ padding: 0.2 });
          }
        }}
        onZoomIn={() => zoomIn()}
        onZoomOut={() => zoomOut()}
        onAutoLayout={async () => {
          const layouted = await layoutProcess(process, process.settings.layoutDirection);
          setProcess(layouted);
          window.setTimeout(() => fitView({ padding: 0.2 }), 50);
        }}
        onValidate={() => validate()}
        onRename={(title) => {
          setProcess({ ...process, title });
          onTitleChange(title);
        }}
        onStatusChange={onStatusChange}
        onDuplicate={async () => {
          const copy = await apiProcessRepository.duplicateProcess(process.id);
          onDuplicated(copy.id);
        }}
        onExportJson={() => {
          const blob = new Blob([JSON.stringify(process, null, 2)], {
            type: "application/json",
          });
          const url = URL.createObjectURL(blob);
          const anchor = document.createElement("a");
          anchor.href = url;
          anchor.download = `${process.title}.json`;
          anchor.click();
          URL.revokeObjectURL(url);
        }}
        onExportPng={async () => {
          if (!wrapperRef.current) return;
          const dataUrl = await toPng(wrapperRef.current, { cacheBust: true });
          const anchor = document.createElement("a");
          anchor.href = dataUrl;
          anchor.download = `${process.title}.png`;
          anchor.click();
        }}
        onClear={() => {
          const cleared = {
            ...process,
            nodes: process.nodes.filter((node) => node.data.objectType === "start"),
            edges: [],
          };
          setProcess(cleared);
        }}
        onDelete={async () => {
          await apiProcessRepository.deleteProcess(process.id);
          onDeleted();
        }}
      />

      <div className="relative flex min-h-0 flex-1 overflow-hidden">
        {viewMode === "design" ? (
          <div className="absolute end-3 top-3 z-20 flex gap-2 md:hidden">
            <button
              type="button"
              className="rounded-md border border-border bg-background px-2 py-1 text-xs transition-colors duration-150 hover:bg-interactive hover:text-interactive-foreground"
              onClick={() => {
                setPropsOpen(false);
                setMobileLibraryOpen((open) => !open);
              }}
            >
              کتابخانه
            </button>
            {propsOpen ? (
              <button
                type="button"
                className="rounded-md border border-border bg-background px-2 py-1 text-xs transition-colors duration-150 hover:bg-interactive hover:text-interactive-foreground"
                onClick={() => setPropsOpen(false)}
              >
                بستن ویژگی‌ها
              </button>
            ) : null}
          </div>
        ) : null}

        {mobileLibraryOpen && showLibrary ? (
          <div className="absolute inset-0 z-30 flex justify-end md:hidden">
            <button
              type="button"
              className="absolute inset-0 bg-overlay"
              aria-label="بستن کتابخانه"
              onClick={() => setMobileLibraryOpen(false)}
            />
            <div className="relative z-10">
              <ProcessObjectLibrary
                onAdd={(item) => {
                  addObject(item.type);
                  setMobileLibraryOpen(false);
                }}
                disabled={viewMode !== "design"}
              />
            </div>
          </div>
        ) : null}
        {showProps ? (
          <div className="absolute inset-0 z-30 flex justify-end md:hidden">
            <button
              type="button"
              className="absolute inset-0 bg-overlay"
              aria-label="بستن ویژگی‌ها"
              onClick={() => setPropsOpen(false)}
            />
            <div className="relative z-10">
              <ProcessPropertiesPanel onClose={() => setPropsOpen(false)} />
            </div>
          </div>
        ) : null}

        <div
          ref={wrapperRef}
          className="relative min-w-0 flex-1 bg-background"
          dir="ltr"
          onDragOver={(event) => {
            event.preventDefault();
            event.dataTransfer.dropEffect = "move";
          }}
          onDrop={(event) => {
            event.preventDefault();
            if (viewMode !== "design") return;
            const type = event.dataTransfer.getData(
              "application/process-object",
            ) as ProcessObjectType;
            if (!type) return;
            const position = screenToFlowPosition({
              x: event.clientX,
              y: event.clientY,
            });
            addObject(type, position);
          }}
        >
          <ReactFlow
            key={processId}
            nodes={nodes}
            edges={edges}
            nodeTypes={nodeTypes}
            edgeTypes={edgeTypes}
            onNodesChange={handleNodesChange}
            onEdgesChange={onEdgesChange}
            onNodeDragStart={() => {
              isDraggingRef.current = true;
            }}
            onNodeDragStop={() => {
              isDraggingRef.current = false;
              if (viewMode !== "design") return;
              syncCurrentFlow({ recordHistory: true });
            }}
            onEdgesDelete={(deleted) => {
              if (viewMode !== "design") return;
              const deletedIds = new Set(deleted.map((edge) => edge.id));
              const current = useProcessStore.getState().process;
              if (!current) return;
              skipStoreSyncRef.current = true;
              setProcess({
                ...current,
                edges: current.edges.filter((edge) => !deletedIds.has(edge.id)),
              });
            }}
            onNodesDelete={(deleted) => {
              if (viewMode !== "design") return;
              const deletedIds = new Set(deleted.map((node) => node.id));
              const current = useProcessStore.getState().process;
              if (!current) return;
              skipStoreSyncRef.current = true;
              setProcess({
                ...current,
                nodes: current.nodes.filter((node) => !deletedIds.has(node.id)),
                edges: current.edges.filter(
                  (edge) =>
                    !deletedIds.has(edge.source) && !deletedIds.has(edge.target),
                ),
              });
            }}
            onConnect={onConnect}
            onSelectionChange={onSelectionChange}
            onMoveEnd={(_event, viewport) => {
              const current = useProcessStore.getState().process;
              if (!current || readOnly) return;
              skipStoreSyncRef.current = true;
              setProcess(
                {
                  ...current,
                  viewport: {
                    x: viewport.x,
                    y: viewport.y,
                    zoom: viewport.zoom,
                  },
                },
                { recordHistory: false, dirty: false },
              );
            }}
            onInit={(instance) => {
              if (hasFittedRef.current) return;
              hasFittedRef.current = true;
              if (process.viewport) {
                instance.setViewport(process.viewport);
              } else {
                void instance.fitView({ padding: 0.2 });
              }
            }}
            defaultViewport={process.viewport}
            snapToGrid={process.settings.snapToGrid}
            snapGrid={[16, 16]}
            selectionMode={SelectionMode.Partial}
            selectionOnDrag={viewMode === "design"}
            panOnScroll
            zoomOnScroll
            zoomOnPinch
            panOnDrag={[1, 2]}
            nodesDraggable={viewMode === "design"}
            nodesConnectable={viewMode === "design"}
            elementsSelectable
            deleteKeyCode={viewMode === "design" ? ["Backspace", "Delete"] : null}
            multiSelectionKeyCode="Shift"
            proOptions={{ hideAttribution: true }}
            className="process-canvas"
          >
            <Background
              variant={BackgroundVariant.Dots}
              gap={16}
              size={1}
              color="var(--canvas-dot)"
            />
            <Controls position="bottom-left" showInteractive={false} />
            <MiniMap
              position="bottom-left"
              pannable
              zoomable
              className="!ms-14 !border-border !bg-surface"
            />
          </ReactFlow>
          <ProcessValidationPanel
            onFocus={(nodeId) => {
              if (!nodeId) return;
              const node = nodes.find((item) => item.id === nodeId);
              if (!node) return;
              setCenter(node.position.x, node.position.y, { zoom: 1.2 });
              setNodes((current) =>
                current.map((item) => ({
                  ...item,
                  selected: item.id === nodeId,
                })),
              );
            }}
          />
        </div>

        {showLibrary ? (
          <div className="hidden h-full md:flex">
            <ProcessObjectLibrary
              onAdd={(item) => addObject(item.type)}
              disabled={viewMode !== "design"}
            />
          </div>
        ) : null}
        {showProps ? (
          <div className="hidden h-full md:flex">
            <ProcessPropertiesPanel
              onClose={() => {
                setPropsOpen(false);
              }}
            />
          </div>
        ) : null}
      </div>
    </div>
  );
}

export function ProcessDesigner(props: ProcessDesignerProps) {
  return (
    <ReactFlowProvider>
      <ProcessDesignerInner {...props} />
    </ReactFlowProvider>
  );
}
