import type {
  CreateManagedUserInput,
  ManagedUser,
  UpdateManagedUserInput,
} from "@/features/admin/types";

export interface UserRepository {
  listUsers(): Promise<ManagedUser[]>;
  getUser(id: string): Promise<ManagedUser>;
  createUser(input: CreateManagedUserInput): Promise<ManagedUser>;
  updateUser(id: string, input: UpdateManagedUserInput): Promise<ManagedUser>;
  deleteUser(id: string): Promise<void>;
}
