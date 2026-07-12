import { randomBytes } from "node:crypto";
import { sql } from "kysely";
import { getCoreDatabase } from "../../../database/core-database.js";
export async function seedProductModule() {
  await sql`INSERT IGNORE INTO products (uuid, name, status) VALUES (${randomBytes(4).toString("hex")}, '-', 'active')`.execute(
    getCoreDatabase()
  );
}
