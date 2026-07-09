export type TrialBalanceRow = {
  closingBalance: number;
  credit: number;
  debit: number;
  groupName: string;
  ledgerCode: string;
  ledgerId: string;
  ledgerName: string;
};

export type LedgerStatementRow = {
  amount: number;
  balance: number;
  dc: "debit" | "credit";
  ledgerCode: string;
  ledgerName: string;
  narration: string | null;
  voucherDate: string;
  voucherNo: string;
  voucherType: string;
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
