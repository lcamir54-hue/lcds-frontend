import { nanoid } from "nanoid";

import type { GroupRepository } from "@/features/admin/repositories/group-repository";
import type { ManagedGroup } from "@/features/admin/types";

const STORAGE_KEY = "lcds.admin.groups.v1";

function delay(ms = 80) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function seedGroups(): ManagedGroup[] {
  const now = new Date().toISOString();
  return [
    {
      id: "group-1",
      name: "مدیران سیستم",
      description: "دسترسی کامل به تنظیمات و مدیریت کاربران",
      memberIds: ["user-1"],
      createdAt: now,
      updatedAt: now,
    },
    {
      id: "group-2",
      name: "تولید محتوا",
      description: "نویسندگان و ویراستاران دانش سازمانی",
      memberIds: ["user-2"],
      createdAt: now,
      updatedAt: now,
    },
  ];
}

function readAll(): ManagedGroup[] {
  if (typeof window === "undefined") return [];
  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    const seeded = seedGroups();
    writeAll(seeded);
    return seeded;
  }
  try {
    return JSON.parse(raw) as ManagedGroup[];
  } catch {
    const seeded = seedGroups();
    writeAll(seeded);
    return seeded;
  }
}

function writeAll(groups: ManagedGroup[]) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(groups));
}

export function listGroupsSync(): ManagedGroup[] {
  return readAll();
}

export function getGroupIdsForUser(userId: string): string[] {
  return readAll()
    .filter((group) => group.memberIds.includes(userId))
    .map((group) => group.id);
}

export const localGroupRepository: GroupRepository = {
  async listGroups() {
    await delay();
    return readAll().sort((a, b) => a.name.localeCompare(b.name, "fa"));
  },

  async getGroup(id) {
    await delay();
    const found = readAll().find((group) => group.id === id);
    if (!found) throw new Error("گروه یافت نشد");
    return found;
  },

  async createGroup(input) {
    await delay();
    const groups = readAll();
    if (groups.some((group) => group.name.trim() === input.name.trim())) {
      throw new Error("گروهی با این نام وجود دارد");
    }

    const now = new Date().toISOString();
    const created: ManagedGroup = {
      id: nanoid(10),
      name: input.name.trim(),
      description: input.description?.trim() ?? "",
      memberIds: [...new Set(input.memberIds)],
      createdAt: now,
      updatedAt: now,
    };
    groups.push(created);
    writeAll(groups);
    return created;
  },

  async updateGroup(id, input) {
    await delay();
    const groups = readAll();
    const index = groups.findIndex((group) => group.id === id);
    if (index === -1) throw new Error("گروه یافت نشد");

    const nameTaken = groups.some(
      (group) => group.id !== id && group.name.trim() === input.name.trim(),
    );
    if (nameTaken) throw new Error("گروهی با این نام وجود دارد");

    const current = groups[index]!;
    const updated: ManagedGroup = {
      ...current,
      name: input.name.trim(),
      description: input.description?.trim() ?? "",
      memberIds: [...new Set(input.memberIds)],
      updatedAt: new Date().toISOString(),
    };
    groups[index] = updated;
    writeAll(groups);
    return updated;
  },

  async deleteGroup(id) {
    await delay();
    const groups = readAll();
    if (!groups.some((group) => group.id === id)) {
      throw new Error("گروه یافت نشد");
    }
    writeAll(groups.filter((group) => group.id !== id));
  },
};

/** Remove a deleted user from all group memberships */
export async function removeUserFromAllGroups(userId: string) {
  const groups = readAll();
  writeAll(
    groups.map((group) => ({
      ...group,
      memberIds: group.memberIds.filter((id) => id !== userId),
      updatedAt: new Date().toISOString(),
    })),
  );
}
