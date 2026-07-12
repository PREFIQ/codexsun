import { afterAll, beforeAll, describe, expect, it } from "vitest";

const runDbE2e = process.env.CODEXSUN_DB_E2E === "1";
const suffix = `${Date.now()}_${Math.random().toString(16).slice(2)}`;
const masterDb = `codexsun_e2e_master_${suffix}`;
const tenantOneDb = `codexsun_e2e_tenant_one_${suffix}`;
const tenantTwoDb = `codexsun_e2e_tenant_two_${suffix}`;

describe.skipIf(!runDbE2e)("tenant database e2e", () => {
  beforeAll(() => {
    process.env.JWT_SECRET ||= "tenant-e2e-secret";
    process.env.DB_MASTER_NAME = masterDb;
    process.env.ENABLE_DEFAULT_TENANT_SEED = "1";
    process.env.DEFAULT_TENANT_NAME = "E2E Seed Tenant";
    process.env.DEFAULT_TENANT_CORPORATE_ID = "E2ESEED";
    process.env.DEFAULT_TENANT_SLUG = "e2e-seed";
    process.env.DEFAULT_TENANT_DB_NAME = `e2e_seed_${suffix}`;
  });

  afterAll(async () => {
    const { closePlatformDatabase, platformDatabaseConfig } = await import("../../database/platform-database.js");
    const { createConnection } = await import("mysql2/promise");
    await closePlatformDatabase();

    const config = platformDatabaseConfig();
    const connection = await createConnection({
      host: config.host,
      password: config.password,
      port: config.port,
      user: config.user,
      timezone: "Z"
    });
    try {
      await connection.query(`DROP DATABASE IF EXISTS \`${masterDb}\``);
      await connection.query(`DROP DATABASE IF EXISTS \`${tenantOneDb}\``);
      await connection.query(`DROP DATABASE IF EXISTS \`${tenantTwoDb}\``);
      await connection.query(`DROP DATABASE IF EXISTS \`e2e_seed_${suffix}\``);
    } finally {
      await connection.end();
    }
  });

  it("persists tenants in master database and seeds isolated tenant module settings", async () => {
    const { bootstrapPlatformDatabase } = await import("../../database/platform-database.js");
    const { getTenantDatabase, closeTenantDatabase } = await import("../../database/tenant-database.js");
    const { TenantService } = await import("./tenant.service.js");

    await bootstrapPlatformDatabase();
    const service = new TenantService();

    const tenantOne = await service.createTenant({
      corporateId: null,
      dbHost: process.env.DB_HOST ?? "127.0.0.1",
      dbName: tenantOneDb,
      dbPort: Number(process.env.DB_PORT ?? 3306),
      dbSecretRef: "DB_PASSWORD",
      dbType: "mariadb",
      dbUser: process.env.DB_USER ?? "root",
      defaultLandingApp: "billing",
      enabledModuleKeys: ["platform.application", "billing.sales"],
      mobile: null,
      payloadSettings: {},
      slug: "tenant-one",
      status: "active",
      tenantCode: "TONE",
      tenantName: "Tenant One"
    });

    const tenantTwo = await service.createTenant({
      corporateId: null,
      dbHost: process.env.DB_HOST ?? "127.0.0.1",
      dbName: tenantTwoDb,
      dbPort: Number(process.env.DB_PORT ?? 3306),
      dbSecretRef: "DB_PASSWORD",
      dbType: "mariadb",
      dbUser: process.env.DB_USER ?? "root",
      defaultLandingApp: "application",
      enabledModuleKeys: ["platform.application"],
      mobile: null,
      payloadSettings: {},
      slug: "tenant-two",
      status: "active",
      tenantCode: "TTWO",
      tenantName: "Tenant Two"
    });

    const tenants = await service.listTenants();
    expect(tenants.map((tenant) => tenant.tenantCode).sort()).toEqual(["TONE", "TTWO"]);

    const tenantOneDatabase = getTenantDatabase(tenantOne);
    const tenantTwoDatabase = getTenantDatabase(tenantTwo);

    try {
      const tenantOneModules = await tenantOneDatabase
        .selectFrom("module_settings")
        .select("module_key")
        .orderBy("module_key")
        .execute();
      const tenantTwoModules = await tenantTwoDatabase
        .selectFrom("module_settings")
        .select("module_key")
        .orderBy("module_key")
        .execute();

      expect(tenantOneModules.map((row) => row.module_key)).toEqual(["billing.sales", "platform.application"]);
      expect(tenantTwoModules.map((row) => row.module_key)).toEqual(["platform.application"]);
    } finally {
      await closeTenantDatabase(tenantOne);
      await closeTenantDatabase(tenantTwo);
    }
  });

  it("preserves tenant app access when the default tenant seed runs again", async () => {
    const { bootstrapPlatformDatabase } = await import("../../database/platform-database.js");
    const { seedDefaultTenant } = await import("./tenant.seed.js");
    const { TenantService } = await import("./tenant.service.js");

    await bootstrapPlatformDatabase();
    await seedDefaultTenant();
    const service = new TenantService();
    const existing = await service.getTenant("E2ESEED");
    expect(existing).not.toBeNull();

    await service.updateTenant(String(existing!.id), {
      ...existing!,
      defaultLandingApp: "billing",
      enabledModuleKeys: ["platform.application", "billing.sales"],
      payloadSettings: {
        ...existing!.payloadSettings,
        apps: {
          disabled: [],
          enabled: ["platform.application", "billing.sales"]
        },
        landing: {
          app: "billing",
          mode: "tenant"
        }
      }
    });

    await seedDefaultTenant();

    const afterRestartSeed = await service.getTenant("E2ESEED");
    expect(afterRestartSeed?.enabledModuleKeys.slice().sort()).toEqual(["billing.sales", "platform.application"]);
    expect(afterRestartSeed?.defaultLandingApp).toBe("billing");
  });
});
