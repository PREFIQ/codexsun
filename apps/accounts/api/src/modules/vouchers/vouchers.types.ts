export type VoucherStatus = "draft" | "posted" | "cancelled" | "reversed";
export type VoucherType =
  | "sales"
  | "purchase"
  | "receipt"
  | "payment"
  | "contra"
  | "journal"
  | "credit_note"
  | "debit_note";
export type DebitCredit = "debit" | "credit";
export type TallySyncStatus = "pending" | "synced" | "failed" | "skipped";
export type PostingOperation = "create" | "update" | "cancel" | "delete";

export type VoucherLine = {
  amount: number;
  dc: DebitCredit;
  id: string;
  ledgerCode: string;
  ledgerId: string;
  ledgerName: string;
  narration: string | null;
  sortOrder: number;
};

export type Voucher = {
  createdAt: string;
  id: string;
  narration: string | null;
  sourceApp: string | null;
  sourceDocumentId: string | null;
  sourceDocumentNo: string | null;
  sourceModule: string | null;
  sourceOperation: PostingOperation | null;
  status: VoucherStatus;
  tallyError: string | null;
  tallyExternalId: string | null;
  tallySyncStatus: TallySyncStatus;
  totalCredit: number;
  totalDebit: number;
  updatedAt: string;
  voucherDate: string;
  voucherNo: string;
  voucherType: VoucherType;
  lines: VoucherLine[];
};

export type VoucherLineInput = {
  amount: number;
  dc: DebitCredit;
  ledgerId: string;
  narration?: string | null;
};

export type VoucherSavePayload = {
  lines: VoucherLineInput[];
  narration?: string | null;
  sourceApp?: string | null;
  sourceDocumentId?: string | null;
  sourceDocumentNo?: string | null;
  sourceModule?: string | null;
  sourceOperation?: PostingOperation | null;
  status?: VoucherStatus;
  voucherDate: string;
  voucherNo?: string | null;
  voucherType: VoucherType;
};

export type AccountsPostingRequest = {
  documentDate: string;
  operation: PostingOperation;
  partyLedgerName: string;
  cashOrBankLedgerCode?: string;
  placeOfSupply?: "cgst-sgst" | "igst";
  roundOff?: number;
  sourceApp: "billing";
  sourceDocumentId: string;
  sourceDocumentNo: string;
  sourceModule: "sales" | "purchase" | "receipt" | "payment" | "credit-note" | "debit-note";
  taxableAmount?: number;
  taxAmount?: number;
  totalAmount: number;
};
