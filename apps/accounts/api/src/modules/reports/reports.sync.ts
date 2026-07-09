export const reportsSyncPolicy = {
  conflict: "server-generated",
  direction: "download",
  scope: "tenant"
} as const;

export function shouldSyncReport(reportKey: string) {
  return ["trial-balance", "ledger-statement", "outstanding", "voucher-register", "gst"].includes(reportKey);
}
