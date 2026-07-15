import { dataBridgeJsonStore } from "../../data-bridge-json.store.js";

export async function migrateReconciliationAudit() {
  await dataBridgeJsonStore.initialize("reconciliationReports");
}
