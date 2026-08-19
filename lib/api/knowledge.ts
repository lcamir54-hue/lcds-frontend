import { api, queryString } from "@/lib/api/client";
import type {
  KnowledgeTree,
  PageRead,
  ProcessRead,
  ProcessSettings,
  ProcessViewport,
  PublishStatus,
  TopicRead,
} from "@/lib/api/types";

export function getKnowledgeTree() {
  return api<KnowledgeTree>("/api/v1/knowledge/tree");
}

export function createTopic(input: {
  title: string;
  icon?: string;
  allowedGroupIds: string[];
  markdown?: string;
}) {
  return api<TopicRead>("/api/v1/topics", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function getTopic(topicId: string) {
  return api<TopicRead>(`/api/v1/topics/${topicId}`);
}

export function updateTopic(
  topicId: string,
  input: Partial<{
    title: string;
    icon: string;
    markdown: string;
    allowedGroupIds: string[];
    sortOrder: number;
  }>,
) {
  return api<TopicRead>(`/api/v1/topics/${topicId}`, {
    method: "PATCH",
    body: JSON.stringify(input),
  });
}

export function deleteTopic(topicId: string) {
  return api<void>(`/api/v1/topics/${topicId}`, { method: "DELETE" });
}

export function duplicateTopic(topicId: string) {
  return api<TopicRead>(`/api/v1/topics/${topicId}/duplicate`, {
    method: "POST",
  });
}

export function createPage(
  topicId: string,
  input: { title: string; icon?: string; markdown?: string },
) {
  return api<PageRead>(`/api/v1/topics/${topicId}/pages`, {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function getPage(pageId: string) {
  return api<PageRead>(`/api/v1/pages/${pageId}`);
}

export function updatePage(
  pageId: string,
  input: Partial<{
    title: string;
    icon: string;
    markdown: string;
    status: PublishStatus;
    sortOrder: number;
  }>,
) {
  return api<PageRead>(`/api/v1/pages/${pageId}`, {
    method: "PATCH",
    body: JSON.stringify(input),
  });
}

export function deletePage(pageId: string) {
  return api<void>(`/api/v1/pages/${pageId}`, { method: "DELETE" });
}

export function duplicatePage(pageId: string) {
  return api<PageRead>(`/api/v1/pages/${pageId}/duplicate`, { method: "POST" });
}

export function listTopicPages(topicId: string, includeBody = false) {
  return api(`/api/v1/topics/${topicId}/pages${queryString({ includeBody })}`);
}

export function createProcess(
  topicId: string,
  input: { title: string; icon?: string },
) {
  return api<ProcessRead>(`/api/v1/topics/${topicId}/processes`, {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function getProcess(processId: string) {
  return api<ProcessRead>(`/api/v1/processes/${processId}`);
}

export function updateProcess(
  processId: string,
  input: Partial<{
    title: string;
    icon: string;
    status: PublishStatus;
    sortOrder: number;
  }>,
) {
  return api<ProcessRead>(`/api/v1/processes/${processId}`, {
    method: "PATCH",
    body: JSON.stringify(input),
  });
}

export function saveProcessGraph(
  processId: string,
  input: {
    nodes: unknown[];
    edges: unknown[];
    viewport?: ProcessViewport;
    settings?: ProcessSettings;
  },
) {
  return api<ProcessRead>(`/api/v1/processes/${processId}/graph`, {
    method: "PUT",
    body: JSON.stringify({
      nodes: input.nodes,
      edges: input.edges,
      viewport: input.viewport,
      settings: input.settings,
    }),
  });
}

export function deleteProcess(processId: string) {
  return api<void>(`/api/v1/processes/${processId}`, { method: "DELETE" });
}

export function duplicateProcess(processId: string) {
  return api<ProcessRead>(`/api/v1/processes/${processId}/duplicate`, {
    method: "POST",
  });
}
