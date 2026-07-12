export type AccountGroup = {
  code: string;
  id: string;
  name: string;
  nature: "asset" | "liability" | "income" | "expense" | "capital";
  status: "active" | "inactive";
};

export type LedgerClassification =
  | "adjustment"
  | "bank"
  | "cash"
  | "customer"
  | "discount"
  | "gst_input"
  | "gst_output"
  | "purchase"
  | "round_off"
  | "sales"
  | "supplier";

export type Ledger = {
  classification: LedgerClassification;
  closingBalance: number;
  code: string;
  currentCredit: number;
  currentDebit: number;
  groupId: string;
  groupName: string;
  id: string;
  name: string;
  openingBalance: number;
  status: "active" | "inactive";
  tallyLedgerName: string | null;
};

export type LedgerSavePayload = {
  classification: LedgerClassification;
  code: string;
  groupId: string;
  name: string;
  openingBalance: number;
  status: "active" | "inactive";
  tallyLedgerName?: string | null | undefined;
};

export type VoucherLine = {
  amount: number;
  dc: "debit" | "credit";
  id: string;
  ledgerCode: string;
  ledgerId: string;
  ledgerName: string;
  narration: string | null;
};

export type Voucher = {
  id: string;
  narration: string | null;
  sourceApp: string | null;
  sourceDocumentNo: string | null;
  status: "draft" | "posted" | "cancelled" | "reversed";
  tallySyncStatus: "pending" | "synced" | "failed" | "skipped";
  totalCredit: number;
  totalDebit: number;
  voucherDate: string;
  voucherNo: string;
  voucherType:
    | "sales"
    | "purchase"
    | "receipt"
    | "payment"
    | "contra"
    | "journal"
    | "credit_note"
    | "debit_note";
  lines: VoucherLine[];
};

export type VoucherSavePayload = {
  lines: Array<{
    amount: number;
    dc: "debit" | "credit";
    ledgerId: string;
    narration?: string | null | undefined;
  }>;
  narration?: string | null | undefined;
  status: "draft" | "posted";
  voucherDate: string;
  voucherNo?: string | null | undefined;
  voucherType: Voucher["voucherType"];
};

export type TrialBalanceRow = {
  closingBalance: number;
  credit: number;
  debit: number;
  groupName: string;
  ledgerCode: string;
  ledgerId: string;
  ledgerName: string;
};

export type OutstandingRow = {
  balance: number;
  classification: "customer" | "supplier";
  ledgerCode: string;
  ledgerId: string;
  ledgerName: string;
};

export type VoucherRegisterRow = {
  sourceDocumentNo: string | null;
  status: string;
  tallySyncStatus: string;
  totalCredit: number;
  totalDebit: number;
  voucherDate: string;
  voucherNo: string;
  voucherType: string;
};

export type GstSummaryRow = {
  credit: number;
  debit: number;
  ledgerCode: string;
  ledgerName: string;
  net: number;
};

export type ProfitAndLossRow = {
  amount: number;
  groupName: string;
  nature: "income" | "expense";
};

export type BalanceSheetRow = {
  amount: number;
  groupName: string;
  nature: "asset" | "capital" | "liability";
};

export type AccountsReportsOverview = {
  balanceSheet: BalanceSheetRow[];
  gst: GstSummaryRow[];
  outstanding: OutstandingRow[];
  profitAndLoss: ProfitAndLossRow[];
  trialBalance: TrialBalanceRow[];
  voucherRegister: VoucherRegisterRow[];
};

export type AccountsSettings = {
  financialYear: {
    allowBackdatedPosting: boolean;
    endDate: string;
    lockDate: string | null;
    startDate: string;
  };
  postingRules: {
    deletePolicy: "delete_draft_only" | "reverse_voucher";
    mode: "auto_post" | "draft_review";
    postOnBillingDelete: boolean;
    postOnBillingSave: boolean;
    postOnBillingUpdate: boolean;
    roundOffLedgerCode: string;
  };
  tallyIntegration: {
    companyName: string;
    enabled: boolean;
    lastSyncAt: string | null;
    syncMode: "auto" | "manual";
    tallyUrl: string;
  };
  voucherNumbering: {
    creditNotePrefix: string;
    debitNotePrefix: string;
    journalPrefix: string;
    mode: "auto" | "manual";
    paymentPrefix: string;
    receiptPrefix: string;
    salesPrefix: string;
  };
};

export type AccountsView =
  | { mode: "overview" }
  | { mode: "ledgers" }
  | { mode: "ledger-upsert"; ledger: Ledger | null }
  | { mode: "reports" }
  | { mode: "vouchers" }
  | { mode: "voucher-upsert" };
