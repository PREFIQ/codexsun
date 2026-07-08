import { syncStorageManagerModule } from "./storage-manager.sync.js";

export async function runStorageManagerWorker() {
  return syncStorageManagerModule();
}
