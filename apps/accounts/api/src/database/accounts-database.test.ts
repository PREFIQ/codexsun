import { describe, expect, it } from "vitest";
import { env } from "../env.js";
import { resolveAccountsDatabaseName } from "./accounts-database.js";

describe("Accounts database boundary", () => {
  it("requires an explicit tenant database and rejects master", () => {
    expect(() => resolveAccountsDatabaseName(undefined)).toThrow("x-tenant-db is required");
    expect(() => resolveAccountsDatabaseName(env.DB_MASTER_NAME)).toThrow("cannot use the Platform master database");
    expect(resolveAccountsDatabaseName("tenant_acme_db")).toBe("tenant_acme_db");
  });
});
