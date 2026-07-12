import { describe, expect, it } from "vitest";
import { env } from "../env.js";
import { resolveBillingDatabaseName } from "./billing-database.js";

describe("Billing database boundary", () => {
  it("requires an explicit tenant database and rejects master", () => {
    expect(() => resolveBillingDatabaseName(undefined)).toThrow("x-tenant-db is required");
    expect(() => resolveBillingDatabaseName(env.DB_MASTER_NAME)).toThrow("cannot use the Platform master database");
    expect(resolveBillingDatabaseName("tenant_acme_db")).toBe("tenant_acme_db");
  });
});
