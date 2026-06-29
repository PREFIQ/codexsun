export type AgentKey = "zero" | "codeit" | "custom";

export type AgentPermission = {
  agentKey: AgentKey;
  allowedTools: string[];
  allowedScopes: string[];
  tenantAccessRule: "all" | "assigned" | "none";
  requireUserConfirmation: boolean;
  auditLevel: "all" | "mutations" | "none";
};

export type ToolDefinition = {
  toolKey: string;
  label: string;
  description: string;
  scope: "platform" | "tenant" | "system";
  requiredPermission?: string | undefined;
  requiresConfirmation: boolean;
  auditLevel: "all" | "mutations" | "none";
};

export type PromptTemplate = {
  templateKey: string;
  purpose: string;
  version: string;
  allowedAgents: AgentKey[];
  requiredContext: string[];
  safetyNotes: string;
};

export type AgentActionAudit = {
  auditId: string;
  agentKey: AgentKey;
  userEmail: string;
  tenantId?: string | undefined;
  action: string;
  toolKey: string;
  inputSummary: string;
  outputSummary: string;
  confirmationState: "confirmed" | "auto" | "rejected";
  correlationId?: string | undefined;
  timestamp: string;
};

export type ProviderSetting = {
  providerKey: string;
  label: string;
  modelLabel: string;
  enabled: boolean;
  secretReference: string;
  isLocal: boolean;
};
