import { VouchersService } from "./vouchers.service.js";
import type { AccountsPostingRequest } from "./vouchers.types.js";

export const voucherJobNames = {
  postBillingDocument: "accounts.vouchers.post-billing-document",
  retryTallySync: "accounts.vouchers.retry-tally-sync"
} as const;

export async function processVoucherJob(
  databaseName: string,
  job: { name: string; payload?: unknown }
) {
  if (job.name === voucherJobNames.postBillingDocument) {
    const voucher = await new VouchersService().postSource(
      databaseName,
      job.payload as AccountsPostingRequest
    );
    return { posted: Boolean(voucher), voucher };
  }
  if (job.name === voucherJobNames.retryTallySync) {
    return {
      queued: true,
      reason: "Tally adapter will consume pending vouchers in the integration phase."
    };
  }
  throw new Error(`Unsupported voucher job: ${job.name}`);
}
