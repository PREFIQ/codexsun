export type FileVisibility = "public" | "private" | "tenant";

export type FileMetadata = {
  fileId: string;
  tenantId: string;
  ownerModule: string;
  ownerRecordId: string;
  fileName: string;
  mimeType: string;
  size: number;
  storageKey: string;
  visibility: FileVisibility;
  createdBy: string;
  createdAt: string;
};
