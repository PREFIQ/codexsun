import type { FileMetadata } from "./contracts.js";

export interface FileRepository {
  list(tenantId: string, ownerModule?: string, ownerRecordId?: string): Promise<FileMetadata[]>;
  getById(fileId: string): Promise<FileMetadata | null>;
  create(meta: FileMetadata): Promise<void>;
  delete(fileId: string): Promise<void>;
}

export class InMemoryFileRepository implements FileRepository {
  private files: FileMetadata[] = [];

  async list(tenantId: string, ownerModule?: string, ownerRecordId?: string): Promise<FileMetadata[]> {
    return this.files.filter((f) => {
      if (f.tenantId !== tenantId) return false;
      if (ownerModule && f.ownerModule !== ownerModule) return false;
      if (ownerRecordId && f.ownerRecordId !== ownerRecordId) return false;
      return true;
    }).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  async getById(fileId: string): Promise<FileMetadata | null> {
    return this.files.find((f) => f.fileId === fileId) || null;
  }

  async create(meta: FileMetadata): Promise<void> {
    this.files.push(meta);
  }

  async delete(fileId: string): Promise<void> {
    this.files = this.files.filter((f) => f.fileId !== fileId);
  }
}
