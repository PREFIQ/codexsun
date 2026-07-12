import { afterAll, beforeAll, describe, expect, it } from "vitest";

const runDbE2e = process.env.CODEXSUN_DB_E2E === "1";
const suffix = `${Date.now()}_${Math.random().toString(16).slice(2)}`;
const masterDb = `cxsun_master_kitchen_${suffix}`;
const alphaDb = `cxsun_kitchen_alpha_${suffix}`;
const betaDb = `cxsun_kitchen_beta_${suffix}`;

describe.skipIf(!runDbE2e)("KitchenServe database-per-tenant isolation e2e", () => {
  beforeAll(() => { process.env.DB_MASTER_NAME = masterDb; });
  afterAll(async () => {
    const { closeKitchenServeDatabases } = await import("./kitchen-serve-database.js");
    const { createConnection } = await import("mysql2/promise");
    const { env } = await import("../env.js");
    await closeKitchenServeDatabases();
    const connection = await createConnection({ host: env.DB_HOST, password: env.DB_PASSWORD, port: env.DB_PORT, user: env.DB_USER });
    try { for (const name of [masterDb, alphaDb, betaDb]) await connection.query(`DROP DATABASE IF EXISTS \`${name}\``); } finally { await connection.end(); }
  });

  it("keeps service orders isolated", async () => {
    const { createConnection } = await import("mysql2/promise");
    const { env } = await import("../env.js");
    const admin = await createConnection({ host: env.DB_HOST, password: env.DB_PASSWORD, port: env.DB_PORT, user: env.DB_USER });
    try { for (const name of [alphaDb, betaDb]) await admin.query(`CREATE DATABASE \`${name}\``); } finally { await admin.end(); }
    const { getKitchenServePool } = await import("./kitchen-serve-database.js");
    const alpha = await getKitchenServePool(alphaDb);
    const beta = await getKitchenServePool(betaDb);
    await alpha.query("INSERT INTO kitchen_serve_orders (uuid, tenant_id, table_label, waiter_name, status) VALUES ('alpha-order', 'tenant-alpha', 'A1', 'Alpha Waiter', 'draft')");
    await beta.query("INSERT INTO kitchen_serve_orders (uuid, tenant_id, table_label, waiter_name, status) VALUES ('beta-order', 'tenant-beta', 'B1', 'Beta Waiter', 'draft')");
    const [alphaRows] = await alpha.query("SELECT uuid FROM kitchen_serve_orders");
    const [betaRows] = await beta.query("SELECT uuid FROM kitchen_serve_orders");
    expect((alphaRows as Array<{ uuid: string }>).map((row) => row.uuid)).toEqual(["alpha-order"]);
    expect((betaRows as Array<{ uuid: string }>).map((row) => row.uuid)).toEqual(["beta-order"]);
  }, 30_000);
});
