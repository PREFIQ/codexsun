import type { Kysely } from "kysely";

export const vouchersSeedPolicy = {
  key: "accounts.vouchers.seed",
  strategy: "no-transaction-seeds"
} as const;

export async function seedVouchersModule(_db: Kysely<any>) {
  return {
    seeded: 0,
    reason: "Vouchers are financial transactions and are created only through posting or explicit user entry."
  };
}
