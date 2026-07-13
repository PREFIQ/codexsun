import { sql } from "kysely";
import { getCoreDatabase } from "../../../../database/core-database.js";
import { LedgersRepository } from "./ledgers.repository.js";
export async function seedLedgers() {
  const repository = new LedgersRepository();
  const result = await sql<{
    id: number | string;
  }>`SELECT id FROM ledger_groups WHERE LOWER(name)='general' LIMIT 1`.execute(getCoreDatabase());
  const groupId = Number(result.rows[0]?.id ?? 0);
  if (groupId && !(await repository.findByName(groupId, "General Ledger")))
    await repository.create({ ledgerGroupId: groupId, name: "General Ledger", status: "active" });
}
