import { describe, expect, it } from "vitest";
import { ledgerSchema, voucherSchema } from "./accounts.schema";

describe("accounts workspace validation", () => {
  it("requires a ledger name and group", () => {
    expect(ledgerSchema.safeParse({ classification: "customer", code: "", groupId: "", name: "", openingBalance: 0, status: "active" }).success).toBe(false);
  });

  it("requires at least two voucher lines", () => {
    expect(voucherSchema.safeParse({ lines: [], status: "posted", voucherDate: "2026-07-09", voucherType: "journal" }).success).toBe(false);
  });
});
