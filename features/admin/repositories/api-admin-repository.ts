import type { GroupRepository } from "@/features/admin/repositories/group-repository";
import type { UserRepository } from "@/features/admin/repositories/user-repository";
import type { ManagedGroup, ManagedUser } from "@/features/admin/types";
import {
  createAdminGroup,
  createAdminUser,
  deleteAdminGroup,
  deleteAdminUser,
  listAdminGroups,
  listAdminUsers,
  updateAdminGroup,
  updateAdminUser,
} from "@/lib/api/admin";
import type { AdminGroupRead, AdminUserRead } from "@/lib/api/types";

function toManagedUser(user: AdminUserRead): ManagedUser {
  return {
    id: user.id,
    username: user.username,
    fullName: user.fullName,
    email: user.email ?? "",
    role: user.role,
    isActive: user.isActive,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}

function toManagedGroup(group: AdminGroupRead): ManagedGroup {
  return {
    id: group.id,
    name: group.name,
    description: group.description ?? "",
    memberIds: group.memberIds ?? [],
    createdAt: group.createdAt,
    updatedAt: group.updatedAt,
  };
}

export const apiUserRepository: UserRepository = {
  async listUsers() {
    const result = await listAdminUsers();
    return result.items.map(toManagedUser);
  },

  async getUser(id) {
    const result = await listAdminUsers();
    const found = result.items.find((user) => user.id === id);
    if (!found) throw new Error("کاربر یافت نشد");
    return toManagedUser(found);
  },

  async createUser(input) {
    const created = await createAdminUser({
      username: input.username,
      fullName: input.fullName,
      email: input.email,
      role: input.role,
      password: input.password,
    });
    return toManagedUser(created);
  },

  async updateUser(id, input) {
    const payload: Parameters<typeof updateAdminUser>[1] = {
      username: input.username,
      fullName: input.fullName,
      email: input.email,
      role: input.role,
      isActive: input.isActive,
    };
    if (input.password.trim()) {
      payload.password = input.password;
    }
    const updated = await updateAdminUser(id, payload);
    return toManagedUser(updated);
  },

  async deleteUser(id) {
    await deleteAdminUser(id);
  },
};

export const apiGroupRepository: GroupRepository = {
  async listGroups() {
    const result = await listAdminGroups();
    return result.items.map(toManagedGroup);
  },

  async getGroup(id) {
    const result = await listAdminGroups();
    const found = result.items.find((group) => group.id === id);
    if (!found) throw new Error("گروه یافت نشد");
    return toManagedGroup(found);
  },

  async createGroup(input) {
    const created = await createAdminGroup({
      name: input.name,
      description: input.description,
      memberIds: input.memberIds,
    });
    return toManagedGroup(created);
  },

  async updateGroup(id, input) {
    const updated = await updateAdminGroup(id, {
      name: input.name,
      description: input.description,
      memberIds: input.memberIds,
    });
    return toManagedGroup(updated);
  },

  async deleteGroup(id) {
    await deleteAdminGroup(id);
  },
};
