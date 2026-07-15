import { dataBridgeJsonStore } from "../../data-bridge-json.store.js";
export async function migrateDiscoverySnapshots() {
  await dataBridgeJsonStore.initialize("discoverySnapshots");
}
