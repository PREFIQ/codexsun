import { AppError } from "@codexsun/framework/errors";
import type { FileMetadata, FileVisibility } from "./contracts.js";
import type { FileRepository } from "./repository.js";

export class FileService {
  constructor(private readonly repository: FileRepository) {}

  async listFiles(tenantId: string, ownerModule?: string, ownerRecordId?: string): Promise<FileMetadata[]> {
    if (!tenantId) throw AppError.validation("tenantId is required");
    return this.repository.list(tenantId, ownerModule, ownerRecordId);
  }

  async getFile(fileId: string): Promise<FileMetadata> {
    const file = await this.repository.getById(fileId);
    if (!file) throw AppError.notFound("File not found");
    return file;
  }

  async createMetadata(input: {
    tenantId: string; ownerModule: string; ownerRecordId: string;
    fileName: string; mimeType: string; size: number;
    storageKey: string; visibility?: FileVisibility; createdBy: string;
  }): Promise<FileMetadata> {
    const meta: FileMetadata = {
      fileId: crypto.randomUUID(), tenantId: input.tenantId,
      ownerModule: input.ownerModule, ownerRecordId: input.ownerRecordId,
      fileName: input.fileName, mimeType: input.mimeType, size: input.size,
      storageKey: input.storageKey, visibility: input.visibility || "tenant",
      createdBy: input.createdBy, createdAt: new Date().toISOString()
    };
    await this.repository.create(meta);
    return meta;
  }

  async deleteFile(fileId: string): Promise<void> {
    await this.getFile(fileId);
    await this.repository.delete(fileId);
  }
}
