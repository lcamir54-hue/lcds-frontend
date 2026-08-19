import { api } from "@/lib/api/client";
import type { AclGroup, Paginated } from "@/lib/api/types";

export function listAclGroups() {
  return api<Paginated<AclGroup>>("/api/v1/groups");
}
