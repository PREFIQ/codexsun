import { createHash } from "node:crypto";
import { sql } from "kysely";
import { getCoreDatabase } from "../../database/core-database.js";

export async function seedMasterModule() {
  const database = getCoreDatabase();
  await seedReserved(database, "contacts", "global-contact-reserved", "c0000000", "C-0000");
  await seedReserved(database, "products", "global-product-reserved", "p0000000", "P-0000");
  await seedReserved(database, "work_orders", "global-work-order-reserved", "w0000000", "WO-0000");
  await seedDefaultCompanies(database);
  return { seeded: true, module: "core.master" };
}

async function seedReserved(database: ReturnType<typeof getCoreDatabase>, tableName: string, id: string, uuid: string, code: string) {
  await sql`
    INSERT IGNORE INTO ${sql.table(tableName)}
      (id, uuid, tenant_id, code, name, status, is_active)
    VALUES (${id}, ${uuid}, 'global', ${code}, '-', 'active', 1)
  `.execute(database);
}

async function seedDefaultCompanies(database: ReturnType<typeof getCoreDatabase>) {
  const tenants = await seedTenants(database);
  for (const tenant of tenants) {
    const tenantKey = slug(tenant.tenantCode || tenant.tenantId);
    const name = tenant.tenantName.trim() || "Codexsun";
    await sql`
      INSERT IGNORE INTO companies
        (id, uuid, tenant_id, code, name, legal_name, description, status, is_active, opening_balance, credit_limit)
      VALUES (
        ${`tenant-${tenantKey}-company-default`},
        ${stableUuid(`company:${tenant.tenantId}`)},
        ${tenant.tenantId},
        ${`COMP-${tenantKey}`.toUpperCase().slice(0, 80)},
        ${name},
        ${name},
        ${`Default company profile for ${name}.`},
        'active',
        1,
        0,
        0
      )
    `.execute(database);
  }
}

async function seedTenants(database: ReturnType<typeof getCoreDatabase>) {
  const table = await sql<{ count: number }>`
    SELECT COUNT(*) AS count
    FROM information_schema.TABLES
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'tenants'
  `.execute(database);

  if (Number(table.rows[0]?.count ?? 0) === 0) {
    return [{ tenantCode: "codexsun", tenantId: "default", tenantName: "Codexsun" }];
  }

  const result = await sql<{ tenant_code: string; tenant_name: string; uuid: string }>`
    SELECT tenant_code, tenant_name, uuid
    FROM tenants
    WHERE status = 'active'
    ORDER BY tenant_name ASC
  `.execute(database);

  return result.rows.map((tenant) => ({
    tenantCode: String(tenant.tenant_code),
    tenantId: String(tenant.uuid),
    tenantName: String(tenant.tenant_name)
  }));
}

function stableUuid(value: string) {
  return createHash("sha256").update(value).digest("hex").slice(0, 8);
}

function slug(value: string) {
  return value.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "default";
}
