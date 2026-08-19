import type {
  CreateDocumentInput,
  MarkdownDocument,
} from "@/features/documents/types";

export interface DocumentRepository {
  listDocuments(): Promise<MarkdownDocument[]>;
  getDocument(id: string): Promise<MarkdownDocument>;
  saveDocument(document: MarkdownDocument): Promise<void>;
  createDocument(input: CreateDocumentInput): Promise<MarkdownDocument>;
  deleteDocument(id: string): Promise<void>;
  duplicateDocument(id: string, options?: { ownerId?: string }): Promise<MarkdownDocument>;
}
