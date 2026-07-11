export interface MigrationWorkflow {
  modules: Array<{ key: string; label: string; description: string; executionCapability: boolean }>;
  guardrails: { approvalRequired: boolean; credentialsReturnedToClient: boolean; dryRunRequired: boolean; executionEnabled: boolean; tenantContextRequired: boolean };
  stages: Array<{ key: string; label: string; description: string }>;
  tracks: Array<{ key: "schema" | "data"; label: string; description: string }>;
}
