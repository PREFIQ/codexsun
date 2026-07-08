import { describe, expect, it } from "vitest";
import { tenantMaintenanceNote } from "./tenant-database.schema";

describe("tenant database maintenance", () => {
  it("requires a positive tenant id for maintenance actions", () => {
    expect(() => tenantMaintenanceNote(0, "Tenant backup")).toThrow();
    expect(tenantMaintenanceNote(1, "Tenant backup").tenantId).toBe(1);
  });
});
