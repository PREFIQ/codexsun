import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { sql } from "kysely";

const runDbE2e = process.env.CODEXSUN_DB_E2E === "1";
const suffix = `${Date.now()}_${Math.random().toString(16).slice(2)}`;
const masterDb = `cxsun_master_accounts_${suffix}`;
const alphaDb = `cxsun_accounts_alpha_${suffix}`;
const betaDb = `cxsun_accounts_beta_${suffix}`;

describe.skipIf(!runDbE2e)("Accounts database-per-tenant isolation e2e", () => {
  beforeAll(() => { process.env.DB_MASTER_NAME = masterDb; });
  afterAll(async () => {
    const { closeAllAccountsDatabases } = await import("./accounts-database.js");
    const { createConnection } = await import("mysql2/promise");
    const { env } = await import("../env.js");
    await closeAllAccountsDatabases();
    const connection = await createConnection({ host: env.DB_HOST, password: env.DB_PASSWORD, port: env.DB_PORT, user: env.DB_USER });
    try { for (const name of [masterDb, alphaDb, betaDb]) await connection.query(`DROP DATABASE IF EXISTS \`${name}\``); } finally { await connection.end(); }
  });

  it("keeps ledger groups isolated", async () => {
    const { getAccountsDatabase } = await import("./accounts-database.js");
    const alpha = await getAccountsDatabase(alphaDb);
    const beta = await getAccountsDatabase(betaDb);
    await sql`INSERT INTO account_groups (uuid, code, name, nature, parent_id, is_system, status) VALUES ('a1a1a1a1', 'ALPHA', 'Alpha Private Group', 'asset', NULL, 0, 'active')`.execute(alpha);
    await sql`INSERT INTO account_groups (uuid, code, name, nature, parent_id, is_system, status) VALUES ('b1b1b1b1', 'BETA', 'Beta Private Group', 'asset', NULL, 0, 'active')`.execute(beta);
    const alphaRows = await sql<{ name: string }>`SELECT name FROM account_groups`.execute(alpha);
    const betaRows = await sql<{ name: string }>`SELECT name FROM account_groups`.execute(beta);
    expect(alphaRows.rows.map((row) => row.name)).toContain("Alpha Private Group");
    expect(alphaRows.rows.map((row) => row.name)).not.toContain("Beta Private Group");
    expect(betaRows.rows.map((row) => row.name)).toContain("Beta Private Group");
    expect(betaRows.rows.map((row) => row.name)).not.toContain("Alpha Private Group");
  }, 30_000);
});
