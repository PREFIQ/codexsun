import { ok } from "@codexsun/framework/http";
import type { FastifyInstance } from "fastify";
import { requireSuperAdmin } from "../auth/guards.js";

function responseMeta(request: { correlationId?: string; id: string; tenantId?: string }) {
  return {
    requestId: request.id,
    ...(request.correlationId ? { correlationId: request.correlationId } : {}),
    ...(request.tenantId ? { tenantId: request.tenantId } : {})
  };
}

export async function registerAgentRoutes(app: FastifyInstance) {
  app.get("/agents/permissions/:agentKey", async (request) => {
    await requireSuperAdmin(app, request);
    const { agentKey } = request.params as { agentKey: string };
    const permissions = await app.agentService.getAgentPermissions(agentKey as never);
    return ok(permissions, responseMeta(request));
  });

  app.get("/agents/tools", async (request) => {
    await requireSuperAdmin(app, request);
    const tools = await app.agentService.listTools();
    return ok(tools, responseMeta(request));
  });

  app.get("/agents/tools/:toolKey", async (request) => {
    await requireSuperAdmin(app, request);
    const { toolKey } = request.params as { toolKey: string };
    const tool = await app.agentService.getTool(toolKey);
    return ok(tool, responseMeta(request));
  });

  app.get("/agents/prompts", async (request) => {
    await requireSuperAdmin(app, request);
    const query = request.query as { agentKey?: string };
    const templates = await app.agentService.listPromptTemplates(query.agentKey as never);
    return ok(templates, responseMeta(request));
  });

  app.get("/agents/prompts/:templateKey", async (request) => {
    await requireSuperAdmin(app, request);
    const { templateKey } = request.params as { templateKey: string };
    const template = await app.agentService.getPromptTemplate(templateKey);
    return ok(template, responseMeta(request));
  });

  app.get("/agents/audit", async (request) => {
    await requireSuperAdmin(app, request);
    const query = request.query as { tenantId?: string; agentKey?: string };
    const audits = await app.agentService.listAudit(query.tenantId, query.agentKey as never);
    return ok(audits, responseMeta(request));
  });

  app.get("/agents/providers", async (request) => {
    await requireSuperAdmin(app, request);
    const providers = await app.agentService.listProviders();
    return ok(providers, responseMeta(request));
  });

  app.put("/agents/providers/:providerKey", async (request) => {
    await requireSuperAdmin(app, request);
    const { providerKey } = request.params as { providerKey: string };
    const body = request.body as { label: string; modelLabel: string; enabled: boolean; isLocal: boolean };
    await app.agentService.updateProvider({
      providerKey, label: body.label || providerKey, modelLabel: body.modelLabel || "",
      enabled: body.enabled, secretReference: "***", isLocal: body.isLocal
    });
    return ok({ providerKey, updated: true }, responseMeta(request));
  });
}
