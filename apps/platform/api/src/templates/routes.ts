import { ok } from "@codexsun/framework/http";
import type { FastifyInstance } from "fastify";
import { requireSession } from "../auth/guards.js";

function responseMeta(request: { correlationId?: string; id: string; tenantId?: string }) {
  return {
    requestId: request.id,
    ...(request.correlationId ? { correlationId: request.correlationId } : {}),
    ...(request.tenantId ? { tenantId: request.tenantId } : {})
  };
}

export async function registerTemplateRoutes(app: FastifyInstance) {
  app.get("/templates", async (request) => {
    await requireSession(app, request);
    const query = request.query as { moduleKey?: string; documentType?: string };
    const templates = await app.templateService.listTemplates(query.moduleKey, query.documentType);
    return ok(templates, responseMeta(request));
  });

  app.get("/templates/:templateKey", async (request) => {
    await requireSession(app, request);
    const { templateKey } = request.params as { templateKey: string };
    const template = await app.templateService.getTemplate(templateKey);
    return ok(template, responseMeta(request));
  });
}
