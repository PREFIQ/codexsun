import type { Kysely } from "kysely";

export async function migrateReportsModule(_db: Kysely<any>) {
  return {
    migrated: true,
    reason: "Reports are computed from ledgers and vouchers; no report-owned tables are required."
  };
}
