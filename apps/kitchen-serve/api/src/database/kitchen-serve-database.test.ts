import { describe, expect, it } from "vitest";
import { env } from "../env.js";
import { resolveKitchenServeDatabaseName } from "./kitchen-serve-database.js";

describe("KitchenServe database boundary", () => {
  it("requires an explicit tenant database and rejects master", () => {
    expect(() => resolveKitchenServeDatabaseName(undefined)).toThrow("x-tenant-db is required");
    expect(() => resolveKitchenServeDatabaseName(env.DB_MASTER_NAME)).toThrow("cannot use the Platform master database");
    expect(resolveKitchenServeDatabaseName("tenant_acme_db")).toBe("tenant_acme_db");
  });
});
