import type { PublishStatus } from "@/features/documents/types";
import type {
  CreateProcessInput,
  ProcessDocument,
} from "@/features/processes/types/process.types";

export interface ProcessRepository {
  getProcess(id: string): Promise<ProcessDocument>;
  createProcess(input: CreateProcessInput & { id: string }): Promise<ProcessDocument>;
  saveProcess(process: ProcessDocument): Promise<ProcessDocument | void>;
  updateMeta?(
    id: string,
    input: Partial<{ title: string; icon: string; status: PublishStatus }>,
  ): Promise<ProcessDocument>;
  duplicateProcess(id: string): Promise<ProcessDocument>;
  deleteProcess(id: string): Promise<void>;
}
