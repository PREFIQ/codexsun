export type LedgerStatus = "active" | "inactive";

export type AccountGroupNature = "asset" | "liability" | "income" | "expense" | "capital";

export type LedgerClassification =
  | "bank"
  | "cash"
  | "customer"
  | "discount"
  | "gst_input"
  | "gst_output"
  | "purchase"
  | "round_off"
  | "sales"
  | "supplier"
  | "adjustment";

export type AccountGroup = {
  code: string;
  id: string;
  isSystem: boolean;
  name: string;
  nature: AccountGroupNature;
  parentId: string | null;
  status: LedgerStatus;
  uuid: string;
};

export type Ledger = {
  classification: LedgerClassification;
  closingBalance: number;
  code: string;
  currentCredit: number;
  currentDebit: number;
  groupCode: string;
  groupId: string;
  groupName: string;
  id: string;
  isSystem: boolean;
  name: string;
  openingBalance: number;
  status: LedgerStatus;
  tallyLedgerName: string | null;
  uuid: string;
};

export type LedgerSavePayload = {
  classification: LedgerClassification;
  code: string;
  groupId: string;
  name: string;
  openingBalance?: number;
  status: LedgerStatus;
  tallyLedgerName?: string | null;
};

export type LedgerLookup = Pick<
  Ledger,
  "classification" | "code" | "groupName" | "id" | "name" | "status"
>;
