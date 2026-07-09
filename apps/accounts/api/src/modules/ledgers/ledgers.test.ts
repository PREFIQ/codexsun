import { describe, expect, it } from "vitest";
import { ledgersModule } from "./ledgers.module.js";
import { shouldSyncLedgerRecord } from "./ledgers.sync.js";

describe("accounts ledgers module contract", () => {
  it("declares the tenant scoped ledger module", () => {
    expect(ledgersModule.key).toBe("accounts.ledgers");
    expect(ledgersModule.scope).toBe("tenant");
  });

  it("keeps inactive records syncable when updated for audit", () => {
    expect(shouldSyncLedgerRecord({ status: "inactive", updatedAt: "2026-07-09" })).toBe(true);
  });
});
