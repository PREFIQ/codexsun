import { describe, expect, it } from "vitest";
import { databaseMaintenanceNeedsSync } from "./database-maintenance.sync.js";

describe("database maintenance", () => {
  it("detects sync changes", () => {
    expect(databaseMaintenanceNeedsSync(1, 2)).toBe(true);
  });
});
