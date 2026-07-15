import { dataBridgeJsonStore } from "../../data-bridge-json.store.js";
export async function migrateTransforms() {
  await dataBridgeJsonStore.initialize("transformPlans");
}
