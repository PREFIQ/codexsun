import { dataBridgeJsonStore } from "../../data-bridge-json.store.js";

export async function migrateExecutionRuns() {
  await dataBridgeJsonStore.initialize("executionRuns");
}
