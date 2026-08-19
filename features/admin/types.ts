import { z } from "zod";

export const managedUserRoleSchema = z.enum(["admin", "user"]);
export type ManagedUserRole = z.infer<typeof managedUserRoleSchema>;

export const managedUserSchema = z.object({
  id: z.string().min(1),
  username: z.string().min(1),
  fullName: z.string().min(1),
  email: z.string().default(""),
  role: managedUserRoleSchema.default("user"),
  isActive: z.boolean().default(true),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type ManagedUser = z.infer<typeof managedUserSchema>;

export const userFormSchema = z.object({
  username: z.string().min(2, "نام کاربری باید حداقل ۲ کاراکتر باشد"),
  fullName: z.string().min(2, "نام کامل الزامی است"),
  email: z.union([z.literal(""), z.string().email("ایمیل معتبر نیست")]),
  role: managedUserRoleSchema,
  password: z.string(),
  isActive: z.boolean(),
});

export type UserFormValues = z.infer<typeof userFormSchema>;

export const createManagedUserInputSchema = userFormSchema.extend({
  password: z.string().min(4, "رمز عبور باید حداقل ۴ کاراکتر باشد"),
});

export type CreateManagedUserInput = z.infer<typeof createManagedUserInputSchema>;

export type UpdateManagedUserInput = UserFormValues;

export const managedGroupSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  description: z.string().default(""),
  memberIds: z.array(z.string()).default([]),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type ManagedGroup = z.infer<typeof managedGroupSchema>;

export const groupFormSchema = z.object({
  name: z.string().min(2, "نام گروه الزامی است"),
  description: z.string(),
  memberIds: z.array(z.string()),
});

export type GroupFormValues = z.infer<typeof groupFormSchema>;

export type CreateManagedGroupInput = GroupFormValues;
export type UpdateManagedGroupInput = GroupFormValues;

export const ROLE_LABELS: Record<ManagedUserRole, string> = {
  admin: "مدیر",
  user: "کاربر",
};
