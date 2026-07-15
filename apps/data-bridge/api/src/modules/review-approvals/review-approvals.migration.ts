import { dataBridgeJsonStore } from "../../data-bridge-json.store.js";

export async function migrateReviewApprovals() {
  await dataBridgeJsonStore.initialize("reviewApprovals");
}
