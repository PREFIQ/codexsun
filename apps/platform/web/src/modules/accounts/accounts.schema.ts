import { z } from "zod";

export const ledgerSchema = z.object({
  classification: z.enum(["adjustment", "bank", "cash", "customer", "discount", "gst_input", "gst_output", "purchase", "round_off", "sales", "supplier"]),
  code: z.string().trim().min(1, "Ledger code is required."),
  groupId: z.string().trim().min(1, "Group is required."),
  name: z.string().trim().min(1, "Ledger name is required."),
  openingBalance: z.number(),
  status: z.enum(["active", "inactive"]),
  tallyLedgerName: z.string().nullable().optional()
});

export const voucherSchema = z.object({
  lines: z.array(z.object({ amount: z.number().positive(), dc: z.enum(["debit", "credit"]), ledgerId: z.string().min(1), narration: z.string().nullable().optional() })).min(2),
  narration: z.string().nullable().optional(),
  status: z.enum(["draft", "posted"]),
  voucherDate: z.string().min(1),
  voucherNo: z.string().nullable().optional(),
  voucherType: z.enum(["sales", "purchase", "receipt", "payment", "contra", "journal", "credit_note", "debit_note"])
});
