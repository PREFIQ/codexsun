import type { AgentActionAudit, AgentPermission, ToolDefinition, PromptTemplate, ProviderSetting, AgentKey } from "./contracts.js";

export interface AgentRepository {
  getPermissions(agentKey: AgentKey): Promise<AgentPermission | null>;
  listTools(): Promise<ToolDefinition[]>;
  getTool(toolKey: string): Promise<ToolDefinition | null>;
  listTemplates(allowedAgent?: AgentKey): Promise<PromptTemplate[]>;
  getTemplate(templateKey: string): Promise<PromptTemplate | null>;
  listAudit(tenantId?: string, agentKey?: AgentKey): Promise<AgentActionAudit[]>;
  writeAudit(audit: AgentActionAudit): Promise<void>;
  listProviders(): Promise<ProviderSetting[]>;
  updateProvider(setting: ProviderSetting): Promise<void>;
}

export class InMemoryAgentRepository implements AgentRepository {
  private permissions: AgentPermission[] = [
    { agentKey: "zero", allowedTools: ["read_record", "list_records", "search"], allowedScopes: ["tenant"], tenantAccessRule: "assigned", requireUserConfirmation: false, auditLevel: "mutations" },
    { agentKey: "codeit", allowedTools: ["read_record", "list_records", "search", "execute_task", "run_analysis"], allowedScopes: ["tenant", "platform"], tenantAccessRule: "assigned", requireUserConfirmation: true, auditLevel: "all" },
    { agentKey: "custom", allowedTools: [], allowedScopes: [], tenantAccessRule: "none", requireUserConfirmation: true, auditLevel: "all" }
  ];

  private tools: ToolDefinition[] = [
    { toolKey: "read_record", label: "Read Record", description: "View a single record by ID", scope: "tenant", requiresConfirmation: false, auditLevel: "mutations" },
    { toolKey: "list_records", label: "List Records", description: "Query records with filters", scope: "tenant", requiresConfirmation: false, auditLevel: "mutations" },
    { toolKey: "search", label: "Search", description: "Full-text search across records", scope: "tenant", requiresConfirmation: false, auditLevel: "mutations" },
    { toolKey: "execute_task", label: "Execute Task", description: "Run a predefined task", scope: "platform", requiredPermission: "platform.task.execute", requiresConfirmation: true, auditLevel: "all" },
    { toolKey: "run_analysis", label: "Run Analysis", description: "Execute data analysis", scope: "tenant", requiresConfirmation: true, auditLevel: "all" },
    { toolKey: "list_tenants", label: "List Tenants", description: "View all platform tenants", scope: "platform", requiredPermission: "platform.tenant.profile.view", requiresConfirmation: false, auditLevel: "mutations" }
  ];

  private templates: PromptTemplate[] = [
    { templateKey: "data_query", purpose: "Query tenant data with natural language", version: "1.0", allowedAgents: ["zero", "codeit"], requiredContext: ["tenantId", "userRole"], safetyNotes: "Must not expose other tenant data" },
    { templateKey: "task_execution", purpose: "Execute a predefined business task", version: "1.0", allowedAgents: ["codeit"], requiredContext: ["tenantId", "taskId", "userEmail"], safetyNotes: "Requires user confirmation before execution" },
    { templateKey: "system_analysis", purpose: "Analyze platform/system data", version: "1.0", allowedAgents: ["codeit"], requiredContext: ["scope"], safetyNotes: "Platform scope only; not tenant data" }
  ];

  private audits: AgentActionAudit[] = [];

  private providers: ProviderSetting[] = [
    { providerKey: "openai", label: "OpenAI", modelLabel: "gpt-4o", enabled: false, secretReference: "***", isLocal: false },
    { providerKey: "local", label: "Local LLM", modelLabel: "llama-3", enabled: false, secretReference: "***", isLocal: true },
    { providerKey: "anthropic", label: "Anthropic", modelLabel: "claude-3", enabled: false, secretReference: "***", isLocal: false }
  ];

  async getPermissions(agentKey: AgentKey): Promise<AgentPermission | null> {
    return this.permissions.find((p) => p.agentKey === agentKey) || null;
  }

  async listTools(): Promise<ToolDefinition[]> { return this.tools; }

  async getTool(toolKey: string): Promise<ToolDefinition | null> {
    return this.tools.find((t) => t.toolKey === toolKey) || null;
  }

  async listTemplates(allowedAgent?: AgentKey): Promise<PromptTemplate[]> {
    if (!allowedAgent) return this.templates;
    return this.templates.filter((t) => t.allowedAgents.includes(allowedAgent));
  }

  async getTemplate(templateKey: string): Promise<PromptTemplate | null> {
    return this.templates.find((t) => t.templateKey === templateKey) || null;
  }

  async listAudit(tenantId?: string, agentKey?: AgentKey): Promise<AgentActionAudit[]> {
    return this.audits.filter((a) => {
      if (tenantId && a.tenantId !== tenantId) return false;
      if (agentKey && a.agentKey !== agentKey) return false;
      return true;
    }).sort((a, b) => b.timestamp.localeCompare(a.timestamp));
  }

  async writeAudit(audit: AgentActionAudit): Promise<void> { this.audits.push(audit); }

  async listProviders(): Promise<ProviderSetting[]> { return this.providers; }

  async updateProvider(setting: ProviderSetting): Promise<void> {
    const idx = this.providers.findIndex((p) => p.providerKey === setting.providerKey);
    if (idx >= 0) this.providers[idx] = setting;
    else this.providers.push(setting);
  }
}
