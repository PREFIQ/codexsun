export type ExecutionRunStatus =
  "queued" | "running" | "paused" | "blocked" | "completed" | "failed" | "cancelled";
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
export type ExecutionConflict = {
  id: string;
  table: string;
  sourceRecordRef: string;
  targetRecordRef: string;
  status: "pending" | "decided" | "applied";
  decision: {
    action: "override" | "reject";
    actor: string;
    reason: string;
    decidedAt: string;
  } | null;
  detectedAt: string;
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
export type ExecutionReviewOption = {
  id: number;
  planName: string;
  tenant: string;
  status: string;
  dryRunSucceeded: boolean;
  approvalReference: string | null;
};
export type CreateExecutionInput = { reviewId: number; requestedBy: string; batchSize: number };
export type ConflictDecisionInput = {
  action: "override" | "reject";
  actor: string;
  reason: string;
};
