import type {
  CreateManagedGroupInput,
  ManagedGroup,
  UpdateManagedGroupInput,
} from "@/features/admin/types";

export interface GroupRepository {
  listGroups(): Promise<ManagedGroup[]>;
  getGroup(id: string): Promise<ManagedGroup>;
  createGroup(input: CreateManagedGroupInput): Promise<ManagedGroup>;
  updateGroup(id: string, input: UpdateManagedGroupInput): Promise<ManagedGroup>;
  deleteGroup(id: string): Promise<void>;
}
