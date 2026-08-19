import { api, queryString } from "@/lib/api/client";
import type {
  AdminGroupRead,
  AdminStats,
  AdminUserRead,
  Paginated,
  UserRole,
} from "@/lib/api/types";

const DEFAULT_LIMIT = 200;

export function listAdminUsers(input: { q?: string; limit?: number; offset?: number } = {}) {
  return api<Paginated<AdminUserRead>>(
    `/api/v1/admin/users${queryString({
      q: input.q,
      limit: input.limit ?? DEFAULT_LIMIT,
      offset: input.offset ?? 0,
    })}`,
  );
}

export function createAdminUser(input: {
  username: string;
  fullName: string;
  email?: string;
  role: UserRole;
  password: string;
}) {
  return api<AdminUserRead>("/api/v1/admin/users", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function updateAdminUser(
  userId: string,
  input: Partial<{
    username: string;
    fullName: string;
    email: string;
    role: UserRole;
    password: string;
    isActive: boolean;
  }>,
) {
  return api<AdminUserRead>(`/api/v1/admin/users/${userId}`, {
    method: "PATCH",
    body: JSON.stringify(input),
  });
}

export function deleteAdminUser(userId: string) {
  return api<void>(`/api/v1/admin/users/${userId}`, { method: "DELETE" });
}

export function listAdminGroups(input: { limit?: number; offset?: number } = {}) {
  return api<Paginated<AdminGroupRead>>(
    `/api/v1/admin/groups${queryString({
      limit: input.limit ?? DEFAULT_LIMIT,
      offset: input.offset ?? 0,
    })}`,
  );
}

export function createAdminGroup(input: {
  name: string;
  description?: string;
  memberIds?: string[];
}) {
  return api<AdminGroupRead>("/api/v1/admin/groups", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function updateAdminGroup(
  groupId: string,
  input: Partial<{
    name: string;
    description: string;
    memberIds: string[];
  }>,
) {
  return api<AdminGroupRead>(`/api/v1/admin/groups/${groupId}`, {
    method: "PATCH",
    body: JSON.stringify(input),
  });
}

export function deleteAdminGroup(groupId: string) {
  return api<void>(`/api/v1/admin/groups/${groupId}`, { method: "DELETE" });
}

export function getAdminStats() {
  return api<AdminStats>("/api/v1/admin/stats");
}
