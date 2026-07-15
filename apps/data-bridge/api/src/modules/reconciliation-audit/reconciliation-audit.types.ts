export type ReconciliationStatus = "needs_attention" | "pending_signoff" | "signed_off";

export type ReconciliationTableEvidence = {
  sourceTable: string;
  targetTable: string;
  processedRows: number;
  insertedRows: number;
  overriddenRows: number;
  rejectedRows: number;
  verifiedRows: number;
  missingRows: number;
  mismatchedRows: number;
  sourceHash: string;
  targetHash: string;
};

export type ReconciliationException = {
  id: string;
  table: string;
  category: "missing" | "mismatch" | "financial" | "operator";
  details: string;
  status: "open" | "resolved";
  createdBy: string;
  createdAt: string;
  resolvedBy: string | null;
  resolvedAt: string | null;
  resolution: string | null;
};

export type ClientSignOff = {
  clientName: string;
  clientReference: string;
  signedBy: string;
  note: string;
  signedAt: string;
};

export type ReconciliationReport = {
  id: number;
  executionRunId: number;
  reviewId: number;
  tenant: string;
  name: string;
  status: ReconciliationStatus;
  generatedBy: string;
  generatedAt: string;
  tables: ReconciliationTableEvidence[];
  exceptions: ReconciliationException[];
  signOff: ClientSignOff | null;
  createdAt: string;
  updatedAt: string;
};
