import type { EntryRecord } from "./entries.types.js";

export function shouldSyncEntryToAccounts(entry: Pick<EntryRecord, "balanceAmount" | "isActive" | "status">) {
  return entry.isActive && entry.status === "posted" && entry.balanceAmount >= 0;
}

export function describeEntriesSyncBatch(records: Array<Pick<EntryRecord, "balanceAmount" | "id" | "isActive" | "status">>) {
  const eligible = records.filter(shouldSyncEntryToAccounts);
  return {
    eligible: eligible.length,
    remaining: records.length - eligible.length,
    total: records.length
  };
}
