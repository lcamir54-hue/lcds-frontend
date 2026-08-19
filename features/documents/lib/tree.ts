import type { DocumentMeta } from "@/features/documents/types";
import type { TopicTreeNode } from "@/lib/api/types";

export function flattenKnowledgeTree(topics: TopicTreeNode[]): DocumentMeta[] {
  const items: DocumentMeta[] = [];

  for (const topic of topics) {
    items.push({
      id: topic.id,
      title: topic.title,
      icon: topic.icon,
      kind: "topic",
      status: "draft",
      parent: null,
      order: topic.sortOrder,
      ownerId: topic.ownerId,
      allowedGroupIds: topic.allowedGroupIds,
      canWrite: topic.canWrite,
      canCreateChild: topic.canCreateChild,
      createdAt: topic.createdAt,
      updatedAt: topic.updatedAt,
    });

    for (const page of topic.pages) {
      items.push({
        id: page.id,
        title: page.title,
        icon: page.icon,
        kind: "page",
        status: page.status,
        parent: topic.id,
        order: page.sortOrder,
        ownerId: page.ownerId,
        allowedGroupIds: [],
        canWrite: page.canWrite,
        canCreateChild: false,
        createdAt: page.updatedAt,
        updatedAt: page.updatedAt,
      });
    }

    for (const process of topic.processes) {
      items.push({
        id: process.id,
        title: process.title,
        icon: process.icon,
        kind: "process",
        status: process.status,
        parent: topic.id,
        order: process.sortOrder,
        ownerId: process.ownerId,
        allowedGroupIds: [],
        canWrite: process.canWrite,
        canCreateChild: false,
        createdAt: process.updatedAt,
        updatedAt: process.updatedAt,
      });
    }
  }

  return items;
}

export function findTreeItem(
  items: DocumentMeta[],
  id: string,
): DocumentMeta | undefined {
  return items.find((item) => item.id === id);
}
