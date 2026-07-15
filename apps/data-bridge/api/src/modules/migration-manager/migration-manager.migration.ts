import { dataBridgeJsonStore } from "../../data-bridge-json.store.js";
export async function migrateMigrationManager() {
  await dataBridgeJsonStore.initialize("migrationJobs");
}
