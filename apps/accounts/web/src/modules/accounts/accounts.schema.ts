import { z } from "zod";

export const ledgerSchema = z.object({
  classification: z.enum([
    "adjustment",
    "bank",
    "cash",
    "customer",
    "discount",
    "gst_input",
    "gst_output",
    "purchase",
    "round_off",
    "sales",
    "supplier"
  ]),
  code: z.string().trim().min(1, "Ledger code is required."),
  groupId: z.string().trim().min(1, "Group is required."),
  name: z.string().trim().min(1, "Ledger name is required."),
  openingBalance: z.number(),
  status: z.enum(["active", "inactive"]),
  tallyLedgerName: z.string().nullable().optional()
});

export const voucherSchema = z.object({
  lines: z
    .array(
      z.object({
        amount: z.number().positive(),
        dc: z.enum(["debit", "credit"]),
        ledgerId: z.string().min(1),
        narration: z.string().nullable().optional()
      })
    )
    .min(2),
  narration: z.string().nullable().optional(),
  status: z.enum(["draft", "posted"]),
  voucherDate: z.string().min(1),
  voucherNo: z.string().nullable().optional(),
  voucherType: z.enum([
    "sales",
    "purchase",
    "receipt",
    "payment",
    "contra",
    "journal",
    "credit_note",
    "debit_note"
  ])
});

export const accountsSettingsSchema = z.object({
  financialYear: z.object({
    allowBackdatedPosting: z.boolean(),
    endDate: z.string().min(1, "Financial year end date is required."),
    lockDate: z.string().nullable(),
    startDate: z.string().min(1, "Financial year start date is required.")
  }),
  postingRules: z.object({
    deletePolicy: z.enum(["delete_draft_only", "reverse_voucher"]),
    mode: z.enum(["auto_post", "draft_review"]),
    postOnBillingDelete: z.boolean(),
    postOnBillingSave: z.boolean(),
    postOnBillingUpdate: z.boolean(),
    roundOffLedgerCode: z.string().trim().min(1, "Round off ledger code is required.")
  }),
  tallyIntegration: z.object({
    companyName: z.string(),
    enabled: z.boolean(),
    lastSyncAt: z.string().nullable(),
    syncMode: z.enum(["auto", "manual"]),
    tallyUrl: z.string().trim().min(1, "Tally URL is required.")
  }),
  voucherNumbering: z.object({
    creditNotePrefix: z.string().trim().min(1),
    debitNotePrefix: z.string().trim().min(1),
    journalPrefix: z.string().trim().min(1),
    mode: z.enum(["auto", "manual"]),
    paymentPrefix: z.string().trim().min(1),
    receiptPrefix: z.string().trim().min(1),
    salesPrefix: z.string().trim().min(1)
  })
});
