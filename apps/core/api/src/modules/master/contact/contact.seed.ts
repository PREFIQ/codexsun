import { randomBytes } from "node:crypto";
import { sql } from "kysely";
import { getCoreDatabase } from "../../../database/core-database.js";
export async function seedContactModule() {
  await sql`INSERT IGNORE INTO contacts (uuid, code, name, status) VALUES (${randomBytes(4).toString("hex")}, 'C-0000', '-', 'active')`.execute(
    getCoreDatabase()
  );
}
