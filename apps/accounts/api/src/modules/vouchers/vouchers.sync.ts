export const vouchersSyncPolicy = {
  conflict: "server-rejects-stale-posting",
  direction: "upload-download",
  scope: "tenant",
  supportsOfflineDrafts: true
} as const;

export function canSyncVoucher(record: {
  status?: string;
  totalCredit?: number;
  totalDebit?: number;
}) {
  if (record.status === "posted")
    return Number(record.totalCredit ?? 0) === Number(record.totalDebit ?? 0);
  return record.status === "draft";
}
