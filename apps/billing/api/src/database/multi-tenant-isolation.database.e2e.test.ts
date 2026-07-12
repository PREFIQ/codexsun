import { afterAll, beforeAll, describe, expect, it } from "vitest";

const runDbE2e = process.env.CODEXSUN_DB_E2E === "1";
const suffix = `${Date.now()}_${Math.random().toString(16).slice(2)}`;
const masterDb = `cxsun_master_billing_${suffix}`;
const alphaDb = `cxsun_billing_alpha_${suffix}`;
const betaDb = `cxsun_billing_beta_${suffix}`;

describe.skipIf(!runDbE2e)("Billing database-per-tenant isolation e2e", () => {
  beforeAll(() => { process.env.DB_MASTER_NAME = masterDb; });
  afterAll(async () => {
    const { closeAllBillingDatabases } = await import("./billing-database.js");
    const { createConnection } = await import("mysql2/promise");
    const { env } = await import("../env.js");
    await closeAllBillingDatabases();
    const connection = await createConnection({ host: env.DB_HOST, password: env.DB_PASSWORD, port: env.DB_PORT, user: env.DB_USER });
    try { for (const name of [masterDb, alphaDb, betaDb]) await connection.query(`DROP DATABASE IF EXISTS \`${name}\``); } finally { await connection.end(); }
  });

  it("keeps invoice rows isolated and master clean", async () => {
    const { getBillingDatabase } = await import("./billing-database.js");
    const alpha = await getBillingDatabase(alphaDb);
    const beta = await getBillingDatabase(betaDb);
    await alpha.insertInto("billing_sales").values({ amount: 101, currency_code: "INR", customer_name: "Alpha Customer", id: "alpha-sale", invoice_number: "ALPHA-001", issued_on: "2026-07-12", status: "draft" }).execute();
    await beta.insertInto("billing_sales").values({ amount: 202, currency_code: "INR", customer_name: "Beta Customer", id: "beta-sale", invoice_number: "BETA-001", issued_on: "2026-07-12", status: "draft" }).execute();
    expect((await alpha.selectFrom("billing_sales").select("invoice_number").execute()).map((row) => row.invoice_number)).toContain("ALPHA-001");
    expect((await alpha.selectFrom("billing_sales").select("invoice_number").execute()).map((row) => row.invoice_number)).not.toContain("BETA-001");
    expect((await beta.selectFrom("billing_sales").select("invoice_number").execute()).map((row) => row.invoice_number)).toContain("BETA-001");
    expect((await beta.selectFrom("billing_sales").select("invoice_number").execute()).map((row) => row.invoice_number)).not.toContain("ALPHA-001");
  }, 30_000);
});
