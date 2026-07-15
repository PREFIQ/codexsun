import { dataBridgeJsonStore } from "../../data-bridge-json.store.js";
export async function migrateMappingsTransforms() {
  await Promise.all([
    dataBridgeJsonStore.initialize("mappingPlans"),
    dataBridgeJsonStore.initialize("transformPlans")
  ]);
}
