export type MigrationTrack = "schema" | "data";
export type MigrationStage = "discover" | "map" | "review" | "approved" | "execute" | "reconcile";

export interface MigrationGuardrails {
  approvalRequired: true;
  credentialsReturnedToClient: false;
  dryRunRequired: true;
  executionEnabled: false;
  tenantContextRequired: true;
}

export interface MigrationWorkflow {
  modules: Array<{ key: string; label: string; description: string; executionCapability: boolean }>;
  guardrails: MigrationGuardrails;
  stages: Array<{ key: MigrationStage; label: string; description: string }>;
  tracks: Array<{ key: MigrationTrack; label: string; description: string }>;
}

export type MigrationProjectStatus = "draft" | "discovered" | "mapped" | "in-review" | "approved" | "running" | "reconciling" | "completed" | "blocked";

export interface MigrationGateInput {
  approvalReference?: string;
  dryRunPassed: boolean;
  planChecksum?: string;
  reconciliationPassed?: boolean;
  status: MigrationProjectStatus;
  tenantId?: string;
}
