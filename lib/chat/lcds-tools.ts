import { API_BASE_URL } from "@/lib/api/config";

type LcdsFetchOptions = {
  token: string;
  signal?: AbortSignal;
};

async function lcdsGet<T>(path: string, { token, signal }: LcdsFetchOptions): Promise<T> {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${token}`,
    },
    signal,
    cache: "no-store",
  });

  const data = await res.json().catch(() => null);
  if (!res.ok) {
    const detail =
      typeof data?.detail === "string" ? data.detail : `درخواست ${path} ناموفق بود`;
    throw new Error(detail);
  }
  return data as T;
}

export const CHAT_TOOLS = [
  {
    type: "function" as const,
    function: {
      name: "search_knowledge",
      description:
        "Search topics, pages, and processes the current user can read. Use this first.",
      parameters: {
        type: "object",
        properties: {
          query: {
            type: "string",
            description: "Keywords to match against titles",
          },
        },
        required: ["query"],
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "read_page",
      description: "Read a page markdown body by id.",
      parameters: {
        type: "object",
        properties: {
          pageId: { type: "string" },
        },
        required: ["pageId"],
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "read_topic",
      description: "Read a topic intro markdown by id.",
      parameters: {
        type: "object",
        properties: {
          topicId: { type: "string" },
        },
        required: ["topicId"],
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "read_process",
      description: "Read process metadata and a compact graph summary by id.",
      parameters: {
        type: "object",
        properties: {
          processId: { type: "string" },
        },
        required: ["processId"],
      },
    },
  },
];

type KnowledgeTree = {
  topics: Array<{
    id: string;
    title: string;
    kind: "topic";
    pages: Array<{ id: string; title: string; kind: "page"; status: string }>;
    processes: Array<{ id: string; title: string; kind: "process"; status: string }>;
  }>;
};

function matchesQuery(title: string, query: string) {
  const hay = title.toLowerCase();
  return query
    .trim()
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean)
    .some((part) => hay.includes(part));
}

export async function executeChatTool(
  name: string,
  rawArgs: string,
  options: LcdsFetchOptions,
): Promise<string> {
  let args: Record<string, string> = {};
  try {
    args = JSON.parse(rawArgs || "{}") as Record<string, string>;
  } catch {
    args = {};
  }

  if (name === "search_knowledge") {
    const query = args.query ?? "";
    const tree = await lcdsGet<KnowledgeTree>("/api/v1/knowledge/tree", options);
    const hits: Array<{ id: string; kind: string; title: string; topicId?: string }> = [];

    for (const topic of tree.topics) {
      if (!query || matchesQuery(topic.title, query)) {
        hits.push({ id: topic.id, kind: "topic", title: topic.title });
      }
      for (const page of topic.pages) {
        if (!query || matchesQuery(page.title, query) || matchesQuery(topic.title, query)) {
          hits.push({
            id: page.id,
            kind: "page",
            title: page.title,
            topicId: topic.id,
          });
        }
      }
      for (const process of topic.processes) {
        if (!query || matchesQuery(process.title, query) || matchesQuery(topic.title, query)) {
          hits.push({
            id: process.id,
            kind: "process",
            title: process.title,
            topicId: topic.id,
          });
        }
      }
    }

    return JSON.stringify({ query, total: hits.length, items: hits.slice(0, 20) });
  }

  if (name === "read_page") {
    const page = await lcdsGet<{
      id: string;
      title: string;
      markdown: string;
      topicId: string;
      status: string;
    }>(`/api/v1/pages/${args.pageId}`, options);
    return JSON.stringify({
      id: page.id,
      title: page.title,
      topicId: page.topicId,
      status: page.status,
      markdown: page.markdown.slice(0, 8000),
    });
  }

  if (name === "read_topic") {
    const topic = await lcdsGet<{
      id: string;
      title: string;
      markdown: string;
    }>(`/api/v1/topics/${args.topicId}`, options);
    return JSON.stringify({
      id: topic.id,
      title: topic.title,
      markdown: topic.markdown.slice(0, 4000),
    });
  }

  if (name === "read_process") {
    const process = await lcdsGet<{
      id: string;
      title: string;
      status: string;
      nodes: Array<{ id: string; data?: { title?: string; objectType?: string } }>;
      edges: unknown[];
    }>(`/api/v1/processes/${args.processId}`, options);
    return JSON.stringify({
      id: process.id,
      title: process.title,
      status: process.status,
      nodeCount: process.nodes.length,
      edgeCount: Array.isArray(process.edges) ? process.edges.length : 0,
      nodes: process.nodes.slice(0, 30).map((node) => ({
        id: node.id,
        title: node.data?.title,
        objectType: node.data?.objectType,
      })),
    });
  }

  throw new Error(`ابزار ناشناخته: ${name}`);
}
