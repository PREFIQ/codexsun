import { sql } from "kysely";
import { getCoreDatabase } from "../../database/core-database.js";

export async function seedMasterModule() {
  const database = getCoreDatabase();
  await seedReserved(database, "core_master_contacts", "global-contact-reserved", "c0000000", "C-0000");
  await seedReserved(database, "core_master_products", "global-product-reserved", "p0000000", "P-0000");
  await seedReserved(database, "core_master_work_orders", "global-work-order-reserved", "w0000000", "WO-0000");
  return { seeded: true, module: "core.master" };
}

async function seedReserved(database: ReturnType<typeof getCoreDatabase>, tableName: string, id: string, uuid: string, code: string) {
  await sql`
    INSERT IGNORE INTO ${sql.table(tableName)}
      (id, uuid, tenant_id, code, name, status, is_active)
    VALUES (${id}, ${uuid}, 'global', ${code}, '-', 'active', 1)
  `.execute(database);
}
