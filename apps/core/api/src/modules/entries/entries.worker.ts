import type { EntryKind } from "./entries.types.js";

export type EntriesWorkerJob = {
  id: string;
  kind: EntryKind;
  name: "entries.accounts-posting" | "entries.status-refresh";
  tenantId: string;
};

export async function processEntriesJob(job: EntriesWorkerJob) {
  return {
    job,
    processed: true,
    processedAt: new Date().toISOString()
  };
}
