import assert from "node:assert/strict";
import { rm } from "node:fs/promises";
import { resolve } from "node:path";
import { createConnection, type RowDataPacket } from "mysql2/promise";

const runId = Date.now();
const masterDatabaseName = `codexsun_platform_e2e_${runId}`;
const tenantDatabaseName = `codexsun_tenant_e2e_${runId}`;
const tenantCode = `E2E${runId}`;
const tenantSlug = `codexsun-e2e-${runId}`;

Object.assign(process.env, {
  DB_MASTER_NAME: masterDatabaseName,
  DEFAULT_TENANT_CORPORATE_ID: tenantCode,
  DEFAULT_TENANT_DB_NAME: tenantDatabaseName,
  DEFAULT_TENANT_DOMAIN: `${tenantSlug}.localhost`,
  DEFAULT_TENANT_NAME: "CODEXSUN Bootstrap E2E",
  DEFAULT_TENANT_SLUG: tenantSlug,
  ENABLE_DEFAULT_TENANT_SEED: "1",
  NODE_ENV: "test"
});

const { env } = await import("../../apps/platform/api/src/env.js");
const { bootstrapPlatformDatabase, closePlatformDatabase } =
  await import("../../apps/platform/api/src/database/platform-database.js");
const { closeAllTenantDatabases } =
  await import("../../apps/platform/api/src/database/tenant-database.js");
const { seedDefaultTenant } =
  await import("../../apps/platform/api/src/modules/tenant/tenant.seed.js");
const { bootstrapCoreDatabase, closeCoreDatabase } =
  await import("../../apps/core/api/src/database/core-database.js");
const { bootstrapBillingDatabase, closeAllBillingDatabases } =
  await import("../../apps/billing/api/src/database/billing-database.js");

const admin = await createConnection({
  host: env.DB_HOST,
  password: env.DB_PASSWORD,
  port: env.DB_PORT,
  user: env.DB_USER
});

try {
  await bootstrapPlatformDatabase();
  await seedDefaultTenant();
  await bootstrapCoreDatabase(tenantDatabaseName);
  await bootstrapBillingDatabase(tenantDatabaseName);

  const initial = await loadState();
  assert.equal(initial.platform.tenants, 1);
  assert.equal(initial.platform.tenantDomains, 1);
  assert.equal(initial.platform.subscriptions, 1);
  assert.ok(initial.platform.apps > 0);
  assert.ok(initial.platform.plans > 0);
  assert.equal(initial.tenant.moduleSettings, 2);
  assert.equal(initial.tenant.enabledBillingModules, 1);
  assert.equal(initial.tenant.companies, 1);
  assert.equal(initial.tenant.codexsunCompanies, 1);
  assert.equal(initial.tenant.currentFinancialYears, 1);
  assert.equal(initial.tenant.defaultCompanies, 1);
  assert.equal(initial.tenant.demoSuppliers, 1);
  assert.equal(initial.tenant.billingSettings, 1);
  assert.equal(initial.tenant.billingTables, 8);

  await closeAllBillingDatabases();
  await closeCoreDatabase();
  await closeAllTenantDatabases();
  await closePlatformDatabase();

  await bootstrapPlatformDatabase();
  await seedDefaultTenant();
  await bootstrapCoreDatabase(tenantDatabaseName);
  await bootstrapBillingDatabase(tenantDatabaseName);

  const restarted = await loadState();
  assert.deepEqual(restarted, initial);
  console.log("Platform/Core/Billing bootstrap E2E passed", {
    masterDatabaseName,
    state: restarted,
    tenantDatabaseName
  });
} finally {
  await closeAllBillingDatabases().catch(() => undefined);
  await closeCoreDatabase().catch(() => undefined);
  await closeAllTenantDatabases().catch(() => undefined);
  await closePlatformDatabase().catch(() => undefined);
  await admin.query(`DROP DATABASE IF EXISTS \`${tenantDatabaseName}\``);
  await admin.query(`DROP DATABASE IF EXISTS \`${masterDatabaseName}\``);
  await admin.end();
  await rm(resolve(process.cwd(), "storage", tenantSlug), { force: true, recursive: true });
}

async function loadState() {
  await admin.changeUser({ database: masterDatabaseName });
  const platform = {
    apps: await count("platform_apps"),
    plans: await count("plans"),
    subscriptions: await count("subscriptions"),
    tenantDomains: await count("tenant_domains"),
    tenants: await count("tenants")
  };

  await admin.changeUser({ database: tenantDatabaseName });
  const tenant = {
    billingSettings: await countWhere(
      "billing_company_settings",
      "settings_key = 'billing' AND company_id = (SELECT company_id FROM default_company_settings WHERE singleton_key = 1)"
    ),
    billingTables: await countBillingRootTables(),
    codexsunCompanies: await countWhere("companies", "name = 'codexsun'"),
    companies: await count("companies"),
    currentFinancialYears: await countWhere("financial_years", "is_current = 1"),
    defaultCompanies: await count("default_company_settings"),
    demoSuppliers: await countWhere(
      "contacts",
      "code = 'C-0000' AND name = 'Codexsun Demo Supplier' AND status = 'active'"
    ),
    enabledBillingModules: await countWhere(
      "module_settings",
      "module_key = 'billing.sales' AND enabled = 1"
    ),
    moduleSettings: await count("module_settings")
  };
  return { platform, tenant };
}

async function count(tableName: string) {
  const [rows] = await admin.query<Array<RowDataPacket & { row_count: number | string }>>(
    `SELECT COUNT(*) AS row_count FROM \`${tableName}\``
  );
  return Number(rows[0]?.row_count ?? 0);
}

async function countWhere(tableName: string, predicate: string) {
  const [rows] = await admin.query<Array<RowDataPacket & { row_count: number | string }>>(
    `SELECT COUNT(*) AS row_count FROM \`${tableName}\` WHERE ${predicate}`
  );
  return Number(rows[0]?.row_count ?? 0);
}

async function countBillingRootTables() {
  const [rows] = await admin.query<Array<RowDataPacket & { row_count: number | string }>>(
    "SELECT COUNT(*) AS row_count FROM information_schema.TABLES WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME IN ('billing_sales','billing_purchases','billing_export_sales','billing_quotations','billing_payments','billing_receipts','billing_settings','billing_dashboard_snapshots')"
  );
  return Number(rows[0]?.row_count ?? 0);
}
