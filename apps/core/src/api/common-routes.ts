import { ok } from "@codexsun/framework/http";
import type { FastifyInstance } from "fastify";
import { AppError } from "@codexsun/framework/errors";
import { type CoreRouteContext, auditRecordEvent } from "./index.js";

export async function registerCoreCommonRoutes(app: FastifyInstance, ctx: CoreRouteContext) {
  app.get("/core/common/definitions", async (request) => {
    const session = await ctx.guardSession(app, request);
    ctx.guardPermission(session, "core.common.view");
    const definitions = app.coreDefinitionService.list();
    return ok(definitions, responseMeta(request));
  });

  app.get("/core/common/records", async (request) => {
    const session = await ctx.guardSession(app, request);
    const tenantId = requireTenantContext(request, session);
    ctx.guardPermission(session, "core.common.view");
    const query = request.query as { definitionKey?: string };
    const records = await app.coreRecordService.list(tenantId, query.definitionKey);
    return ok(records, responseMeta(request));
  });

  app.post("/core/common/records", async (request) => {
    const session = await ctx.guardSession(app, request);
    const tenantId = requireTenantContext(request, session);
    await ctx.guardActiveTenant(app, tenantId);
    await ctx.guardFeatureEnabled(app, tenantId, "core");
    ctx.guardPermission(session, "core.common.manage");
    const body = request.body as { definitionKey: string; code: string; name: string; payload?: Record<string, unknown> };
    const record = await app.coreRecordService.create({
      tenantId, definitionKey: body.definitionKey as any,
      code: body.code, name: body.name,
      ...(body.payload !== undefined ? { payload: body.payload } : {}),
      createdBy: session.email
    });
    await auditRecordEvent(app, {
      actorType: "tenant", actorEmail: session.email,
      eventName: "core.record.created",
      payload: { recordId: record.recordId, definitionKey: body.definitionKey, code: body.code },
      ...(request.correlationId ? { correlationId: request.correlationId } : {}),
      ...(request.tenantId ? { tenantId: request.tenantId } : {})
    });
    return ok(record, responseMeta(request));
  });

  app.get("/core/common/records/:id", async (request) => {
    const session = await ctx.guardSession(app, request);
    const tenantId = requireTenantContext(request, session);
    ctx.guardPermission(session, "core.common.view");
    const { id } = request.params as { id: string };
    const record = await app.coreRecordService.getById(tenantId, id);
    return ok(record, responseMeta(request));
  });

  app.put("/core/common/records/:id", async (request) => {
    const session = await ctx.guardSession(app, request);
    const tenantId = requireTenantContext(request, session);
    await ctx.guardActiveTenant(app, tenantId);
    await ctx.guardFeatureEnabled(app, tenantId, "core");
    ctx.guardPermission(session, "core.common.manage");
    const { id } = request.params as { id: string };
    const body = request.body as { name?: string; payload?: Record<string, unknown> };
    const record = await app.coreRecordService.update({
      tenantId, recordId: id,
      ...(body.name !== undefined ? { name: body.name } : {}),
      ...(body.payload !== undefined ? { payload: body.payload } : {}),
      updatedBy: session.email
    });
    await auditRecordEvent(app, {
      actorType: "tenant", actorEmail: session.email,
      eventName: "core.record.updated",
      payload: { recordId: id },
      ...(request.correlationId ? { correlationId: request.correlationId } : {}),
      ...(request.tenantId ? { tenantId: request.tenantId } : {})
    });
    return ok(record, responseMeta(request));
  });

  app.post("/core/common/records/:id/archive", async (request) => {
    const session = await ctx.guardSession(app, request);
    const tenantId = requireTenantContext(request, session);
    await ctx.guardActiveTenant(app, tenantId);
    await ctx.guardFeatureEnabled(app, tenantId, "core");
    ctx.guardPermission(session, "core.common.manage");
    const { id } = request.params as { id: string };
    await app.coreRecordService.archive(tenantId, id);
    await auditRecordEvent(app, {
      actorType: "tenant", actorEmail: session.email,
      eventName: "core.record.archived",
      payload: { recordId: id },
      ...(request.correlationId ? { correlationId: request.correlationId } : {}),
      ...(request.tenantId ? { tenantId: request.tenantId } : {})
    });
    return ok({ archived: true }, responseMeta(request));
  });

  app.post("/core/common/records/:id/restore", async (request) => {
    const session = await ctx.guardSession(app, request);
    const tenantId = requireTenantContext(request, session);
    await ctx.guardActiveTenant(app, tenantId);
    await ctx.guardFeatureEnabled(app, tenantId, "core");
    ctx.guardPermission(session, "core.common.manage");
    const { id } = request.params as { id: string };
    await app.coreRecordService.restore(tenantId, id);
    await auditRecordEvent(app, {
      actorType: "tenant", actorEmail: session.email,
      eventName: "core.record.restored",
      payload: { recordId: id },
      ...(request.correlationId ? { correlationId: request.correlationId } : {}),
      ...(request.tenantId ? { tenantId: request.tenantId } : {})
    });
    return ok({ restored: true }, responseMeta(request));
  });
}

function requireTenantContext(request: { tenantId?: string }, session: { tenantId?: string }): string {
  const requestTenantId = request.tenantId;
  if (!requestTenantId) {
    throw AppError.validation("x-tenant-id header is required for tenant-scoped routes");
  }
  if (session.tenantId && session.tenantId !== requestTenantId) {
    throw AppError.forbidden("Tenant mismatch: request tenant does not match session tenant");
  }
  return requestTenantId;
}

function responseMeta(request: { correlationId?: string; id: string; tenantId?: string }) {
  return {
    requestId: request.id,
    ...(request.correlationId ? { correlationId: request.correlationId } : {}),
    ...(request.tenantId ? { tenantId: request.tenantId } : {})
  };
}
