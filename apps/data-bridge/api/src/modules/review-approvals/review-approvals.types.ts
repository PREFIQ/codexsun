export type ReviewStatus = "pending" | "approved" | "rejected" | "revoked";

export type ReviewTableEvidence = {
  sourceTable: string;
  targetTable: string;
  mappedFieldCount: number;
  identityFields: string[];
  sourceCount: number;
  targetCount: number;
  blockingRisks: string[];
  warnings: string[];
};

export type ReviewApproval = {
  id: number;
  transformPlanId: number;
  mappingPlanId: number;
  migrationJobId: number;
  tenant: string;
  planName: string;
  checksum: string;
  status: ReviewStatus;
  preparedBy: string;
  preparedAt: string;
  dryRunSucceeded: boolean;
  totalSourceRows: number;
  totalTargetRows: number;
  tables: ReviewTableEvidence[];
  approvalReference: string | null;
  approver: string | null;
  decisionReason: string | null;
  decidedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type ReviewCandidate = {
  transformPlanId: number;
  mappingPlanId: number;
  name: string;
  status: "approved";
  tableCount: number;
  reviewId: number | null;
  reviewStatus: ReviewStatus | null;
};
