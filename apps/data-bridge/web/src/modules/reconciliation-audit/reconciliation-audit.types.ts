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
  signOff: {
    clientName: string;
    clientReference: string;
    signedBy: string;
    note: string;
    signedAt: string;
  } | null;
  createdAt: string;
  updatedAt: string;
};
export type CompletedExecutionOption = { id: number; name: string; tenant: string; status: string };
export type GenerateReportInput = { executionRunId: number; generatedBy: string };
export type SignOffInput = {
  clientName: string;
  clientReference: string;
  signedBy: string;
  note: string;
};
export type AddExceptionInput = {
  table: string;
  category: "financial" | "operator";
  details: string;
  actor: string;
};
