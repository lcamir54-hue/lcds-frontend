import { getSessionUser } from "@/features/auth/lib/auth-session";
import type { DocumentMeta } from "@/features/documents/types";
import type { UserRole } from "@/lib/constants";

export type AccessPrincipal = {
  userId: string | null;
  username: string;
  role: UserRole;
  groupIds: string[];
};

export function getAccessPrincipal(): AccessPrincipal | null {
  const session = getSessionUser();
  if (!session) return null;

  return {
    userId: session.id,
    username: session.username,
    role: session.role,
    groupIds: [],
  };
}

export function isAdminPrincipal(
  principal: AccessPrincipal | null | undefined,
): boolean {
  return principal?.role === "admin";
}

export function canWriteDocument(
  document: Pick<DocumentMeta, "canWrite">,
  principal?: AccessPrincipal | null,
): boolean {
  if (!principal) return false;
  return Boolean(document.canWrite);
}

export function canCreateInTopic(
  topic: Pick<DocumentMeta, "canCreateChild" | "kind">,
  principal?: AccessPrincipal | null,
): boolean {
  if (!principal) return false;
  if (topic.kind && topic.kind !== "topic") return false;
  return topic.canCreateChild !== false;
}

export function canCreateTopic(
  principal: AccessPrincipal | null | undefined,
): boolean {
  return Boolean(principal?.userId);
}

export function canAccessDocument(
  _document: Pick<DocumentMeta, "id">,
  _metas: DocumentMeta[],
  principal: AccessPrincipal | null | undefined,
): boolean {
  return Boolean(principal);
}
