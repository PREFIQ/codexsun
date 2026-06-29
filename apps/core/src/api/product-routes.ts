import { ok } from "@codexsun/framework/http";
import type { FastifyInstance } from "fastify";
import type { CoreRouteContext } from "./index.js";
import { requireTenantContext, responseMeta, auditRecordEvent } from "./index.js";

export async function registerCoreProductRoutes(app: FastifyInstance, ctx: CoreRouteContext) {
  app.get("/core/products", async (request) => {
    const session = await ctx.guardSession(app, request);
    const tenantId = requireTenantContext(request, session);
    ctx.guardPermission(session, "core.product.view");
    const products = await app.coreProductService.list(tenantId);
    return ok(products, responseMeta(request));
  });

  app.get("/core/products/by-code/:code", async (request) => {
    const session = await ctx.guardSession(app, request);
    const tenantId = requireTenantContext(request, session);
    ctx.guardPermission(session, "core.product.view");
    const { code } = request.params as { code: string };
    const product = await app.coreProductService.getByCode(tenantId, code);
    return ok(product, responseMeta(request));
  });

  app.get("/core/products/:id", async (request) => {
    const session = await ctx.guardSession(app, request);
    const tenantId = requireTenantContext(request, session);
    ctx.guardPermission(session, "core.product.view");
    const { id } = request.params as { id: string };
    const product = await app.coreProductService.getById(tenantId, id);
    return ok(product, responseMeta(request));
  });

  app.post("/core/products", async (request) => {
    const session = await ctx.guardSession(app, request);
    const tenantId = requireTenantContext(request, session);
    await ctx.guardActiveTenant(app, tenantId);
    await ctx.guardFeatureEnabled(app, tenantId, "core");
    ctx.guardPermission(session, "core.product.manage");
    const body = request.body as {
      code: string; name: string; description?: string;
      groupCode?: string; categoryCode?: string; typeCode?: string;
      unitCode: string; hsnCode?: string; taxCategoryCode?: string;
      attributes?: any[];
    };
    const product = await app.coreProductService.create({
      tenantId, code: body.code, name: body.name, unitCode: body.unitCode,
      ...(body.description !== undefined ? { description: body.description } : {}),
      ...(body.groupCode !== undefined ? { groupCode: body.groupCode } : {}),
      ...(body.categoryCode !== undefined ? { categoryCode: body.categoryCode } : {}),
      ...(body.typeCode !== undefined ? { typeCode: body.typeCode } : {}),
      ...(body.hsnCode !== undefined ? { hsnCode: body.hsnCode } : {}),
      ...(body.taxCategoryCode !== undefined ? { taxCategoryCode: body.taxCategoryCode } : {}),
      ...(body.attributes !== undefined ? { attributes: body.attributes } : {}),
      createdBy: session.email
    });
    await auditRecordEvent(app, {
      actorType: "tenant", actorEmail: session.email,
      eventName: "core.product.created",
      payload: { itemId: product.itemId, code: body.code, name: body.name },
      ...(request.correlationId ? { correlationId: request.correlationId } : {}),
      ...(request.tenantId ? { tenantId: request.tenantId } : {})
    });
    return ok(product, responseMeta(request));
  });

  app.put("/core/products/:id", async (request) => {
    const session = await ctx.guardSession(app, request);
    const tenantId = requireTenantContext(request, session);
    await ctx.guardActiveTenant(app, tenantId);
    await ctx.guardFeatureEnabled(app, tenantId, "core");
    ctx.guardPermission(session, "core.product.manage");
    const { id } = request.params as { id: string };
    const body = request.body as {
      name?: string; description?: string;
      groupCode?: string; categoryCode?: string; typeCode?: string;
      unitCode?: string; hsnCode?: string; taxCategoryCode?: string;
      attributes?: any[];
    };
    const product = await app.coreProductService.update({
      tenantId, itemId: id,
      ...(body.name !== undefined ? { name: body.name } : {}),
      ...(body.description !== undefined ? { description: body.description } : {}),
      ...(body.groupCode !== undefined ? { groupCode: body.groupCode } : {}),
      ...(body.categoryCode !== undefined ? { categoryCode: body.categoryCode } : {}),
      ...(body.typeCode !== undefined ? { typeCode: body.typeCode } : {}),
      ...(body.unitCode !== undefined ? { unitCode: body.unitCode } : {}),
      ...(body.hsnCode !== undefined ? { hsnCode: body.hsnCode } : {}),
      ...(body.taxCategoryCode !== undefined ? { taxCategoryCode: body.taxCategoryCode } : {}),
      ...(body.attributes !== undefined ? { attributes: body.attributes } : {}),
      updatedBy: session.email
    });
    await auditRecordEvent(app, {
      actorType: "tenant", actorEmail: session.email,
      eventName: "core.product.updated",
      payload: { itemId: id },
      ...(request.correlationId ? { correlationId: request.correlationId } : {}),
      ...(request.tenantId ? { tenantId: request.tenantId } : {})
    });
    return ok(product, responseMeta(request));
  });

  app.post("/core/products/:id/archive", async (request) => {
    const session = await ctx.guardSession(app, request);
    const tenantId = requireTenantContext(request, session);
    await ctx.guardActiveTenant(app, tenantId);
    await ctx.guardFeatureEnabled(app, tenantId, "core");
    ctx.guardPermission(session, "core.product.manage");
    const { id } = request.params as { id: string };
    await app.coreProductService.archive(tenantId, id);
    await auditRecordEvent(app, {
      actorType: "tenant", actorEmail: session.email,
      eventName: "core.product.archived",
      payload: { itemId: id },
      ...(request.correlationId ? { correlationId: request.correlationId } : {}),
      ...(request.tenantId ? { tenantId: request.tenantId } : {})
    });
    return ok({ archived: true }, responseMeta(request));
  });

  app.post("/core/products/:id/restore", async (request) => {
    const session = await ctx.guardSession(app, request);
    const tenantId = requireTenantContext(request, session);
    await ctx.guardActiveTenant(app, tenantId);
    await ctx.guardFeatureEnabled(app, tenantId, "core");
    ctx.guardPermission(session, "core.product.manage");
    const { id } = request.params as { id: string };
    await app.coreProductService.restore(tenantId, id);
    await auditRecordEvent(app, {
      actorType: "tenant", actorEmail: session.email,
      eventName: "core.product.restored",
      payload: { itemId: id },
      ...(request.correlationId ? { correlationId: request.correlationId } : {}),
      ...(request.tenantId ? { tenantId: request.tenantId } : {})
    });
    return ok({ restored: true }, responseMeta(request));
  });
}
