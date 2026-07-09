export const ledgersSyncPolicy = {
  conflict: "server-wins",
  direction: "download",
  scope: "tenant",
  supportsOfflineLookup: true
} as const;

export function shouldSyncLedgerRecord(record: { status?: string; updatedAt?: string }) {
  return record.status !== "inactive" || Boolean(record.updatedAt);
}
