import { describe, expect, it } from "vitest";
import { env } from "../env.js";
import { resolveCoreDatabaseName } from "./core-database.js";

describe("Core database boundary", () => {
  it("requires an explicit tenant database", () => {
    expect(() => resolveCoreDatabaseName(undefined)).toThrow("x-tenant-db is required");
  });

  it("refuses the Platform master database", () => {
    expect(() => resolveCoreDatabaseName(env.DB_MASTER_NAME)).toThrow("cannot use the Platform master database");
  });

  it("accepts a valid tenant database", () => {
    expect(resolveCoreDatabaseName("tenant_acme_db")).toBe("tenant_acme_db");
  });
});
