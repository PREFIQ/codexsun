import { afterAll, beforeAll, describe, expect, it } from "vitest";

const runDbE2e = process.env.CODEXSUN_DB_E2E === "1";
const suffix = `${Date.now()}_${Math.random().toString(16).slice(2)}`;
const masterDb = `cxsun_master_isolation_${suffix}`;
const tenantAlphaDb = `cxsun_tenant_alpha_${suffix}`;
const tenantBetaDb = `cxsun_tenant_beta_${suffix}`;

describe.skipIf(!runDbE2e)("Core database-per-tenant isolation e2e", () => {
  beforeAll(() => {
    process.env.DB_MASTER_NAME = masterDb;
    process.env.JWT_SECRET ||= "core-multi-tenant-isolation-secret";
  });

  afterAll(async () => {
    const { closeCoreDatabase } = await import("./core-database.js");
    const { createConnection } = await import("mysql2/promise");
    const { env } = await import("../env.js");
    await closeCoreDatabase();
    const connection = await createConnection({ host: env.DB_HOST, password: env.DB_PASSWORD, port: env.DB_PORT, user: env.DB_USER });
    try {
      for (const name of [masterDb, tenantAlphaDb, tenantBetaDb]) await connection.query(`DROP DATABASE IF EXISTS \`${name}\``);
    } finally {
      await connection.end();
    }
  });

  it("keeps writes and reads isolated and creates no Core tables in master", async () => {
    const { createApp } = await import("../app.js");
    const { createConnection } = await import("mysql2/promise");
    const { env } = await import("../env.js");
    const app = await createApp();
    try {
      const create = (database: string, tenant: string, name: string) => app.inject({
        headers: { "x-tenant-db": database, "x-tenant-id": tenant },
        method: "POST",
        payload: { isActive: true, name, sortOrder: 900 },
        url: "/core/common/contacts/contact-groups"
      });
      expect((await create(tenantAlphaDb, "tenant-alpha", "Alpha Private Group")).statusCode).toBe(200);
      expect((await create(tenantBetaDb, "tenant-beta", "Beta Private Group")).statusCode).toBe(200);

      const list = async (database: string, tenant: string) => (await app.inject({
        headers: { "x-tenant-db": database, "x-tenant-id": tenant }, method: "GET", url: "/core/common/contacts/contact-groups"
      })).json().data as Array<{ name: string }>;
      const alpha = await list(tenantAlphaDb, "tenant-alpha");
      const beta = await list(tenantBetaDb, "tenant-beta");
      expect(alpha.some((row) => row.name === "Alpha Private Group")).toBe(true);
      expect(alpha.some((row) => row.name === "Beta Private Group")).toBe(false);
      expect(beta.some((row) => row.name === "Beta Private Group")).toBe(true);
      expect(beta.some((row) => row.name === "Alpha Private Group")).toBe(false);

      const missingContext = await app.inject({ method: "GET", url: "/core/common/contacts/contact-groups" });
      expect(missingContext.statusCode).toBeGreaterThanOrEqual(400);

      const masterContext = await app.inject({ headers: { "x-tenant-db": masterDb, "x-tenant-id": "tenant-alpha" }, method: "GET", url: "/core/common/contacts/contact-groups" });
      expect(masterContext.statusCode).toBeGreaterThanOrEqual(400);

      const connection = await createConnection({ host: env.DB_HOST, password: env.DB_PASSWORD, port: env.DB_PORT, user: env.DB_USER });
      try {
        await connection.query(`CREATE DATABASE IF NOT EXISTS \`${masterDb}\``);
        const [masterTables] = await connection.query(`SELECT TABLE_NAME FROM information_schema.TABLES WHERE TABLE_SCHEMA = ? AND TABLE_NAME LIKE 'core\\_%'`, [masterDb]);
        expect(masterTables).toEqual([]);
      } finally {
        await connection.end();
      }
    } finally {
      await app.close();
    }
  }, 180_000);
});
