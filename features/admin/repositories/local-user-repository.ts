import { nanoid } from "nanoid";

import type { UserRepository } from "@/features/admin/repositories/user-repository";
import type { ManagedUser } from "@/features/admin/types";

const STORAGE_KEY = "lcds.admin.users.v1";

function delay(ms = 80) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function seedUsers(): ManagedUser[] {
  const now = new Date().toISOString();
  return [
    {
      id: "user-1",
      username: "admin",
      fullName: "سارا احمدی",
      email: "admin@lcds.local",
      role: "admin",
      isActive: true,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: "user-2",
      username: "user",
      fullName: "کاربر نمونه",
      email: "user@lcds.local",
      role: "user",
      isActive: true,
      createdAt: now,
      updatedAt: now,
    },
  ];
}

function readAll(): ManagedUser[] {
  if (typeof window === "undefined") return [];
  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    const seeded = seedUsers();
    writeAll(seeded);
    return seeded;
  }
  try {
    return JSON.parse(raw) as ManagedUser[];
  } catch {
    const seeded = seedUsers();
    writeAll(seeded);
    return seeded;
  }
}

function writeAll(users: ManagedUser[]) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(users));
}

export function listUsersSync(): ManagedUser[] {
  return readAll();
}

export function findUserByUsername(username: string): ManagedUser | null {
  const needle = username.trim().toLowerCase();
  return (
    readAll().find((user) => user.username.toLowerCase() === needle) ?? null
  );
}

export const localUserRepository: UserRepository = {
  async listUsers() {
    await delay();
    return readAll().sort((a, b) => a.fullName.localeCompare(b.fullName, "fa"));
  },

  async getUser(id) {
    await delay();
    const found = readAll().find((user) => user.id === id);
    if (!found) throw new Error("کاربر یافت نشد");
    return found;
  },

  async createUser(input) {
    await delay();
    const users = readAll();
    if (
      users.some(
        (user) => user.username.toLowerCase() === input.username.trim().toLowerCase(),
      )
    ) {
      throw new Error("این نام کاربری قبلاً استفاده شده است");
    }

    const now = new Date().toISOString();
    const created: ManagedUser = {
      id: nanoid(10),
      username: input.username.trim(),
      fullName: input.fullName.trim(),
      email: input.email?.trim() ?? "",
      role: input.role,
      isActive: true,
      createdAt: now,
      updatedAt: now,
    };
    users.push(created);
    writeAll(users);
    return created;
  },

  async updateUser(id, input) {
    await delay();
    const users = readAll();
    const index = users.findIndex((user) => user.id === id);
    if (index === -1) throw new Error("کاربر یافت نشد");

    const usernameTaken = users.some(
      (user) =>
        user.id !== id &&
        user.username.toLowerCase() === input.username.trim().toLowerCase(),
    );
    if (usernameTaken) {
      throw new Error("این نام کاربری قبلاً استفاده شده است");
    }

    const current = users[index]!;
    const updated: ManagedUser = {
      ...current,
      username: input.username.trim(),
      fullName: input.fullName.trim(),
      email: input.email?.trim() ?? "",
      role: input.role,
      isActive: input.isActive,
      updatedAt: new Date().toISOString(),
    };
    users[index] = updated;
    writeAll(users);
    return updated;
  },

  async deleteUser(id) {
    await delay();
    const users = readAll();
    if (!users.some((user) => user.id === id)) {
      throw new Error("کاربر یافت نشد");
    }
    writeAll(users.filter((user) => user.id !== id));
  },
};
