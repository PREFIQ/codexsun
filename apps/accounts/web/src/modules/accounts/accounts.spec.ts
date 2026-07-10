import { describe, expect, it } from "vitest";
import { accountsSettingsSchema, ledgerSchema, voucherSchema } from "./accounts.schema";

describe("accounts workspace validation", () => {
  it("requires a ledger name and group", () => {
    expect(ledgerSchema.safeParse({ classification: "customer", code: "", groupId: "", name: "", openingBalance: 0, status: "active" }).success).toBe(false);
  });

  it("requires at least two voucher lines", () => {
    expect(voucherSchema.safeParse({ lines: [], status: "posted", voucherDate: "2026-07-09", voucherType: "journal" }).success).toBe(false);
  });

  it("accepts accounts settings for posting and Tally readiness", () => {
    expect(accountsSettingsSchema.safeParse({
      financialYear: { allowBackdatedPosting: false, endDate: "2027-03-31", lockDate: null, startDate: "2026-04-01" },
      postingRules: { deletePolicy: "reverse_voucher", mode: "auto_post", postOnBillingDelete: true, postOnBillingSave: true, postOnBillingUpdate: true, roundOffLedgerCode: "ROUND_OFF" },
      tallyIntegration: { companyName: "", enabled: false, lastSyncAt: null, syncMode: "manual", tallyUrl: "http://localhost:9000" },
      voucherNumbering: { creditNotePrefix: "CN", debitNotePrefix: "DN", journalPrefix: "JV", mode: "auto", paymentPrefix: "PAY", receiptPrefix: "RCPT", salesPrefix: "SALE" }
    }).success).toBe(true);
  });
});
