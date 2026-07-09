export type AccountsPostingMode = "auto_post" | "draft_review";
export type AccountsPostingDeletePolicy = "reverse_voucher" | "delete_draft_only";
export type AccountsVoucherNumberingMode = "auto" | "manual";
export type AccountsTallySyncMode = "manual" | "auto";

export type AccountsSettings = {
  financialYear: {
    allowBackdatedPosting: boolean;
    endDate: string;
    lockDate: string | null;
    startDate: string;
  };
  postingRules: {
    deletePolicy: AccountsPostingDeletePolicy;
    mode: AccountsPostingMode;
    postOnBillingDelete: boolean;
    postOnBillingSave: boolean;
    postOnBillingUpdate: boolean;
    roundOffLedgerCode: string;
  };
  tallyIntegration: {
    companyName: string;
    enabled: boolean;
    lastSyncAt: string | null;
    syncMode: AccountsTallySyncMode;
    tallyUrl: string;
  };
  voucherNumbering: {
    creditNotePrefix: string;
    debitNotePrefix: string;
    journalPrefix: string;
    mode: AccountsVoucherNumberingMode;
    paymentPrefix: string;
    receiptPrefix: string;
    salesPrefix: string;
  };
};

export const defaultAccountsSettings: AccountsSettings = {
  financialYear: {
    allowBackdatedPosting: false,
    endDate: "2027-03-31",
    lockDate: null,
    startDate: "2026-04-01"
  },
  postingRules: {
    deletePolicy: "reverse_voucher",
    mode: "auto_post",
    postOnBillingDelete: true,
    postOnBillingSave: true,
    postOnBillingUpdate: true,
    roundOffLedgerCode: "ROUND_OFF"
  },
  tallyIntegration: {
    companyName: "",
    enabled: false,
    lastSyncAt: null,
    syncMode: "manual",
    tallyUrl: "http://localhost:9000"
  },
  voucherNumbering: {
    creditNotePrefix: "CN",
    debitNotePrefix: "DN",
    journalPrefix: "JV",
    mode: "auto",
    paymentPrefix: "PAY",
    receiptPrefix: "RCPT",
    salesPrefix: "SALE"
  }
};
