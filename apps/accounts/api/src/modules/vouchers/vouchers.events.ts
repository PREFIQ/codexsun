import type { Voucher } from "./vouchers.types.js";

export const voucherEvents = {
  posted: "accounts.voucher.posted",
  reversed: "accounts.voucher.reversed",
  tallyReady: "accounts.voucher.tally-ready"
} as const;

export function createVoucherEvent(action: "posted" | "reversed" | "tally-ready", voucher: Voucher) {
  return {
    name: action === "reversed" ? voucherEvents.reversed : action === "tally-ready" ? voucherEvents.tallyReady : voucherEvents.posted,
    occurredAt: new Date().toISOString(),
    payload: {
      sourceApp: voucher.sourceApp,
      sourceDocumentId: voucher.sourceDocumentId,
      voucherId: voucher.id,
      voucherNo: voucher.voucherNo,
      voucherType: voucher.voucherType
    },
    version: 1
  };
}
