import { AppError } from "@codexsun/framework/errors";
import type { AgentKey, AgentPermission, ToolDefinition, PromptTemplate, AgentActionAudit, ProviderSetting } from "./contracts.js";
import type { AgentRepository } from "./repository.js";

export class AgentService {
  constructor(private readonly repository: AgentRepository) {}

  async getAgentPermissions(agentKey: AgentKey): Promise<AgentPermission> {
    const perm = await this.repository.getPermissions(agentKey);
    if (!perm) throw AppError.notFound(`Agent ${agentKey} not found`);
    return perm;
  }

  async checkToolPermission(agentKey: AgentKey, toolKey: string, tenantId?: string): Promise<boolean> {
    const perm = await this.getAgentPermissions(agentKey);
    if (!perm.allowedTools.includes(toolKey)) return false;
    if (tenantId && perm.tenantAccessRule === "none") return false;
    return true;
  }

  async listTools(): Promise<ToolDefinition[]> { return this.repository.listTools(); }

  async getTool(toolKey: string): Promise<ToolDefinition> {
    const tool = await this.repository.getTool(toolKey);
    if (!tool) throw AppError.notFound("Tool not found");
    return tool;
  }

  async listPromptTemplates(allowedAgent?: AgentKey): Promise<PromptTemplate[]> {
    return this.repository.listTemplates(allowedAgent);
  }

  async getPromptTemplate(templateKey: string): Promise<PromptTemplate> {
    const t = await this.repository.getTemplate(templateKey);
    if (!t) throw AppError.notFound("Prompt template not found");
    return t;
  }

  async listAudit(tenantId?: string, agentKey?: AgentKey): Promise<AgentActionAudit[]> {
    return this.repository.listAudit(tenantId, agentKey);
  }

  async recordAction(input: {
    agentKey: AgentKey; userEmail: string; tenantId?: string;
    action: string; toolKey: string; inputSummary: string;
    outputSummary: string; confirmationState: AgentActionAudit["confirmationState"]; correlationId?: string;
  }): Promise<void> {
    const audit: AgentActionAudit = {
      auditId: crypto.randomUUID(), agentKey: input.agentKey,
      userEmail: input.userEmail, tenantId: input.tenantId,
      action: input.action, toolKey: input.toolKey,
      inputSummary: input.inputSummary, outputSummary: input.outputSummary,
      confirmationState: input.confirmationState,
      correlationId: input.correlationId, timestamp: new Date().toISOString()
    };
    await this.repository.writeAudit(audit);
  }

  async listProviders(): Promise<ProviderSetting[]> { return this.repository.listProviders(); }

  async updateProvider(input: ProviderSetting): Promise<void> {
    const masked: ProviderSetting = { ...input, secretReference: "***" };
    await this.repository.updateProvider(masked);
  }
}
