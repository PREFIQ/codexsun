import type { Kysely } from "kysely";

export async function seedReportsModule(_db: Kysely<any>) {
  return {
    seeded: 0,
    reason: "Reports are computed from account ledgers and vouchers."
  };
}
