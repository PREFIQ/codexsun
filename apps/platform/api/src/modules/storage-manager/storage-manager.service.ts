import { StorageManagerRepository } from "./storage-manager.repository.js";
import type { StorageDownloadInput, StorageFolderPayload, StorageListInput, StorageUploadPayload } from "./storage-manager.types.js";

export class StorageManagerService {
  constructor(private readonly repository = new StorageManagerRepository()) {}

  roots() {
    return this.repository.roots();
  }

  list(input: StorageListInput) {
    return this.repository.list(input);
  }

  createFolder(input: StorageFolderPayload) {
    return this.repository.createFolder(input);
  }

  upload(input: StorageUploadPayload) {
    return this.repository.upload(input);
  }

  download(input: StorageDownloadInput) {
    return this.repository.download(input);
  }
}
