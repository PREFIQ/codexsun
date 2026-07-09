import { describe, expect, it } from "vitest";
import { reportsModule } from "./reports.module.js";
import { shouldSyncReport } from "./reports.sync.js";

describe("accounts reports module contract", () => {
  it("declares tenant scoped reports", () => {
    expect(reportsModule.key).toBe("accounts.reports");
    expect(reportsModule.scope).toBe("tenant");
  });

  it("allows expected report keys to sync", () => {
    expect(shouldSyncReport("trial-balance")).toBe(true);
    expect(shouldSyncReport("unknown")).toBe(false);
  });
});
