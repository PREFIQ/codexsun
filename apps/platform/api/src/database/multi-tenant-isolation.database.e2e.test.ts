import { afterAll, beforeAll, describe, expect, it } from "vitest";

const runDbE2e = process.env.CODEXSUN_DB_E2E === "1";
const suffix = `${Date.now()}_${Math.random().toString(16).slice(2)}`;
const masterDb = `cxsun_master_platform_${suffix}`;
const alphaDb = `cxsun_platform_alpha_${suffix}`;
const betaDb = `cxsun_platform_beta_${suffix}`;
const allowedMasterTables = [
  "access_permissions", "access_roles", "access_users", "codexsun_migrations", "database_maintenance_runs",
  "entitlements", "industries", "plans", "platform_activity", "platform_apps", "queue_jobs", "storage_objects",
  "subscriptions", "tenant_audit_events", "tenant_domains", "tenants"
].sort();

describe.skipIf(!runDbE2e)("Platform master and tenant identity isolation e2e", () => {
  beforeAll(() => {
    process.env.DB_MASTER_NAME = masterDb;
    process.env.ENABLE_DEFAULT_TENANT_SEED = "0";
  });

  afterAll(async () => {
    const { closeAllTenantDatabases } = await import("./tenant-database.js");
    const { closePlatformDatabase } = await import("./platform-database.js");
    const { createConnection } = await import("mysql2/promise");
    const { env } = await import("../env.js");
    await closeAllTenantDatabases();
    await closePlatformDatabase();
    const connection = await createConnection({ host: env.DB_HOST, password: env.DB_PASSWORD, port: env.DB_PORT, user: env.DB_USER });
    try { for (const name of [masterDb, alphaDb, betaDb]) await connection.query(`DROP DATABASE IF EXISTS \`${name}\``); } finally { await connection.end(); }
  });

  it("keeps users, roles, and permissions tenant-local and master platform-only", async () => {
    const { createMasterDatabase, migratePlatformDatabase } = await import("./platform-database.js");
    const { createTenantDatabase, getTenantDatabase } = await import("./tenant-database.js");
    const { migrateTenantRuntimeModule } = await import("../modules/tenant/tenant.migration.js");
    const { createConnection } = await import("mysql2/promise");
    const { env } = await import("../env.js");
    await createMasterDatabase();
    await migratePlatformDatabase();

    const tenant = (dbName: string, code: string) => ({ dbHost: env.DB_HOST, dbName, dbPort: env.DB_PORT, dbUser: env.DB_USER, slug: code.toLowerCase(), tenantCode: code });
    const alphaTenant = tenant(alphaDb, "ALPHA");
    const betaTenant = tenant(betaDb, "BETA");
    await createTenantDatabase(alphaDb);
    await createTenantDatabase(betaDb);
    const alpha = getTenantDatabase(alphaTenant as never);
    const beta = getTenantDatabase(betaTenant as never);
    await migrateTenantRuntimeModule(alpha);
    await migrateTenantRuntimeModule(beta);

    await alpha.insertInto("roles").values({ key: "alpha-admin", label: "Alpha Admin", status: "active", uuid: "a1a1a1a1" }).execute();
    await alpha.insertInto("permissions").values({ key: "alpha.private.read", label: "Alpha Private", status: "active", uuid: "a2a2a2a2" }).execute();
    await alpha.insertInto("users").values({ email: "admin@alpha.test", name: "Alpha Admin", password_hash: "test", role: "alpha-admin", status: "active", uuid: "a3a3a3a3" }).execute();
    await beta.insertInto("roles").values({ key: "beta-admin", label: "Beta Admin", status: "active", uuid: "b1b1b1b1" }).execute();
    await beta.insertInto("permissions").values({ key: "beta.private.read", label: "Beta Private", status: "active", uuid: "b2b2b2b2" }).execute();
    await beta.insertInto("users").values({ email: "admin@beta.test", name: "Beta Admin", password_hash: "test", role: "beta-admin", status: "active", uuid: "b3b3b3b3" }).execute();

    expect((await alpha.selectFrom("users").select("email").execute()).map((row) => row.email)).toEqual(["admin@alpha.test"]);
    expect((await beta.selectFrom("users").select("email").execute()).map((row) => row.email)).toEqual(["admin@beta.test"]);
    expect((await alpha.selectFrom("roles").select("key").execute()).map((row) => row.key)).not.toContain("beta-admin");
    expect((await beta.selectFrom("permissions").select("key").execute()).map((row) => row.key)).not.toContain("alpha.private.read");

    const connection = await createConnection({ database: masterDb, host: env.DB_HOST, password: env.DB_PASSWORD, port: env.DB_PORT, user: env.DB_USER });
    try {
      const [rows] = await connection.query("SELECT TABLE_NAME FROM information_schema.TABLES WHERE TABLE_SCHEMA = ? ORDER BY TABLE_NAME", [masterDb]);
      const names = (rows as Array<{ TABLE_NAME: string }>).map((row) => row.TABLE_NAME).sort();
      expect(names).toEqual(allowedMasterTables);
      expect(names.some((name) => name.startsWith("core_") || name.startsWith("billing_") || name.startsWith("account_") || name.startsWith("kitchen_serve_") || name.startsWith("access_") || name === "module_settings" || name === "schema_migrations")).toBe(false);
    } finally {
      await connection.end();
    }
  }, 60_000);
});
