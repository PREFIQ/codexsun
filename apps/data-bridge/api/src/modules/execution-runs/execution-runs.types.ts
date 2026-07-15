export type ExecutionRunStatus =
  "queued" | "running" | "paused" | "blocked" | "completed" | "failed" | "cancelled";

export type ExecutionConflictDecision = {
  action: "override" | "reject";
  actor: string;
  reason: string;
  decidedAt: string;
};

export type ExecutionConflict = {
  id: string;
  table: string;
  sourceRecordRef: string;
  targetRecordRef: string;
  status: "pending" | "decided" | "applied";
  decision: ExecutionConflictDecision | null;
  detectedAt: string;
};

export type ExecutionTableProgress = {
  sourceTable: string;
  targetTable: string;
  status: ExecutionRunStatus | "pending";
  totalRows: number;
  checkpoint: number;
  insertedRows: number;
  overriddenRows: number;
  rejectedRows: number;
  conflictCount: number;
  error: string | null;
};

export type ExecutionRun = {
  id: number;
  reviewId: number;
  transformPlanId: number;
  migrationJobId: number;
  tenant: string;
  name: string;
  checksum: string;
  approvalReference: string;
  requestedBy: string;
  batchSize: number;
  status: ExecutionRunStatus;
  tables: ExecutionTableProgress[];
  conflicts: ExecutionConflict[];
  currentTable: string | null;
  startedAt: string | null;
  finishedAt: string | null;
  error: string | null;
  createdAt: string;
  updatedAt: string;
};

export type ExecutionLedgerEntry = {
  table: string;
  targetTable: string;
  sourceRecordRef: string;
  targetRecordRef: string;
  outcome: "inserted" | "overridden" | "rejected";
  rowHash: string;
  identityValues: Record<string, unknown>;
  mappedValues: Record<string, unknown>;
  processedAt: string;
};

export type StoredExecutionConflict = ExecutionConflict & {
  sourceValues: Record<string, unknown>;
  mappedValues: Record<string, unknown>;
  identityValues: Record<string, unknown>;
  rowHash: string;
};

export type StoredExecutionRun = Omit<ExecutionRun, "conflicts"> & {
  conflicts: StoredExecutionConflict[];
  ledger: ExecutionLedgerEntry[];
  audit: Array<{ action: string; actor: string; at: string; details?: string }>;
};
