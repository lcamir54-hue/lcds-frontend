export type UserRole = "admin" | "user";
export type PublishStatus = "draft" | "published";
export type DocumentKind = "topic" | "page" | "process";

export type UserPublic = {
  id: string;
  username: string;
  fullName: string;
  email: string;
  role: UserRole;
};

export type TokenResponse = {
  accessToken: string;
  tokenType: string;
  user: UserPublic;
};

export type Paginated<T> = {
  items: T[];
  total: number;
  limit?: number;
  offset?: number;
};

export type AclGroup = {
  id: string;
  name: string;
  description: string;
};

export type TopicTreePage = {
  id: string;
  title: string;
  icon: string;
  kind: "page";
  status: PublishStatus;
  ownerId: string;
  canWrite: boolean;
  sortOrder: number;
  updatedAt: string;
};

export type TopicTreeProcess = {
  id: string;
  title: string;
  icon: string;
  kind: "process";
  status: PublishStatus;
  ownerId: string;
  canWrite: boolean;
  sortOrder: number;
  updatedAt: string;
};

export type TopicTreeNode = {
  id: string;
  title: string;
  icon: string;
  kind: "topic";
  ownerId: string;
  allowedGroupIds: string[];
  canWrite: boolean;
  canCreateChild: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
  pages: TopicTreePage[];
  processes: TopicTreeProcess[];
};

export type KnowledgeTree = {
  topics: TopicTreeNode[];
};

export type TopicRead = {
  id: string;
  title: string;
  icon: string;
  kind: "topic";
  ownerId: string;
  allowedGroupIds: string[];
  canWrite: boolean;
  canCreateChild: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
  markdown: string;
};

export type PageRead = {
  id: string;
  title: string;
  icon: string;
  kind: "page";
  status: PublishStatus;
  ownerId: string;
  canWrite: boolean;
  sortOrder: number;
  updatedAt: string;
  topicId: string;
  markdown: string;
  createdAt: string;
};

export type ProcessViewport = {
  x: number;
  y: number;
  zoom: number;
};

export type ProcessSettings = {
  snapToGrid: boolean;
  preventCycles: boolean;
  layoutDirection: "horizontal" | "vertical";
};

export type ProcessRead = {
  id: string;
  topicId: string;
  type: "process";
  title: string;
  icon: string;
  status: PublishStatus;
  version: number;
  ownerId: string;
  canWrite: boolean;
  sortOrder: number;
  nodes: unknown[];
  edges: unknown[];
  viewport: ProcessViewport;
  settings: ProcessSettings;
  createdAt: string;
  updatedAt: string;
};

export type AdminUserRead = {
  id: string;
  username: string;
  fullName: string;
  email: string;
  role: UserRole;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export type AdminGroupRead = {
  id: string;
  name: string;
  description: string;
  memberIds: string[];
  createdAt: string;
  updatedAt: string;
};

export type AdminStats = {
  users: number;
  groups: number;
  topics: number;
  pages: number;
  processes: number;
};
