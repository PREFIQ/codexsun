import { ok } from "@codexsun/framework/http";
import type { FastifyInstance } from "fastify";
import type { CoreRouteContext } from "./index.js";
import { requireTenantContext, responseMeta, auditRecordEvent } from "./index.js";

export async function registerCoreContactRoutes(app: FastifyInstance, ctx: CoreRouteContext) {
  app.get("/core/contacts", async (request) => {
    const session = await ctx.guardSession(app, request);
    const tenantId = requireTenantContext(request, session);
    ctx.guardPermission(session, "core.contact.view");
    const contacts = await app.coreContactService.list(tenantId);
    return ok(contacts, responseMeta(request));
  });

  app.get("/core/contacts/:id", async (request) => {
    const session = await ctx.guardSession(app, request);
    const tenantId = requireTenantContext(request, session);
    ctx.guardPermission(session, "core.contact.view");
    const { id } = request.params as { id: string };
    const contact = await app.coreContactService.getById(tenantId, id);
    return ok(contact, responseMeta(request));
  });

  app.post("/core/contacts", async (request) => {
    const session = await ctx.guardSession(app, request);
    const tenantId = requireTenantContext(request, session);
    await ctx.guardActiveTenant(app, tenantId);
    await ctx.guardFeatureEnabled(app, tenantId, "core");
    ctx.guardPermission(session, "core.contact.manage");
    const body = request.body as {
      contactType: string; displayName: string; companyName?: string;
      phone?: any[]; email?: any[]; addresses?: any[];
      socialLinks?: any[]; bankAccounts?: any[]; taxIdentities?: any[]; notes?: string;
    };
    const contact = await app.coreContactService.create({
      tenantId, contactType: body.contactType as any, displayName: body.displayName,
      ...(body.companyName !== undefined ? { companyName: body.companyName } : {}),
      ...(body.phone !== undefined ? { phone: body.phone } : {}),
      ...(body.email !== undefined ? { email: body.email } : {}),
      ...(body.addresses !== undefined ? { addresses: body.addresses } : {}),
      ...(body.socialLinks !== undefined ? { socialLinks: body.socialLinks } : {}),
      ...(body.bankAccounts !== undefined ? { bankAccounts: body.bankAccounts } : {}),
      ...(body.taxIdentities !== undefined ? { taxIdentities: body.taxIdentities } : {}),
      ...(body.notes !== undefined ? { notes: body.notes } : {}),
      createdBy: session.email
    });
    await auditRecordEvent(app, {
      actorType: "tenant", actorEmail: session.email,
      eventName: "core.contact.created",
      payload: { contactId: contact.contactId, displayName: body.displayName },
      ...(request.correlationId ? { correlationId: request.correlationId } : {}),
      ...(request.tenantId ? { tenantId: request.tenantId } : {})
    });
    return ok(contact, responseMeta(request));
  });

  app.put("/core/contacts/:id", async (request) => {
    const session = await ctx.guardSession(app, request);
    const tenantId = requireTenantContext(request, session);
    await ctx.guardActiveTenant(app, tenantId);
    await ctx.guardFeatureEnabled(app, tenantId, "core");
    ctx.guardPermission(session, "core.contact.manage");
    const { id } = request.params as { id: string };
    const body = request.body as {
      contactType?: string; displayName?: string; companyName?: string;
      phone?: any[]; email?: any[]; addresses?: any[];
      socialLinks?: any[]; bankAccounts?: any[]; taxIdentities?: any[]; notes?: string;
    };
    const contact = await app.coreContactService.update({
      tenantId, contactId: id,
      ...(body.contactType !== undefined ? { contactType: body.contactType as any } : {}),
      ...(body.displayName !== undefined ? { displayName: body.displayName } : {}),
      ...(body.companyName !== undefined ? { companyName: body.companyName } : {}),
      ...(body.phone !== undefined ? { phone: body.phone } : {}),
      ...(body.email !== undefined ? { email: body.email } : {}),
      ...(body.addresses !== undefined ? { addresses: body.addresses } : {}),
      ...(body.socialLinks !== undefined ? { socialLinks: body.socialLinks } : {}),
      ...(body.bankAccounts !== undefined ? { bankAccounts: body.bankAccounts } : {}),
      ...(body.taxIdentities !== undefined ? { taxIdentities: body.taxIdentities } : {}),
      ...(body.notes !== undefined ? { notes: body.notes } : {}),
      updatedBy: session.email
    });
    await auditRecordEvent(app, {
      actorType: "tenant", actorEmail: session.email,
      eventName: "core.contact.updated",
      payload: { contactId: id },
      ...(request.correlationId ? { correlationId: request.correlationId } : {}),
      ...(request.tenantId ? { tenantId: request.tenantId } : {})
    });
    return ok(contact, responseMeta(request));
  });

  app.post("/core/contacts/:id/archive", async (request) => {
    const session = await ctx.guardSession(app, request);
    const tenantId = requireTenantContext(request, session);
    await ctx.guardActiveTenant(app, tenantId);
    await ctx.guardFeatureEnabled(app, tenantId, "core");
    ctx.guardPermission(session, "core.contact.manage");
    const { id } = request.params as { id: string };
    await app.coreContactService.archive(tenantId, id);
    await auditRecordEvent(app, {
      actorType: "tenant", actorEmail: session.email,
      eventName: "core.contact.archived",
      payload: { contactId: id },
      ...(request.correlationId ? { correlationId: request.correlationId } : {}),
      ...(request.tenantId ? { tenantId: request.tenantId } : {})
    });
    return ok({ archived: true }, responseMeta(request));
  });

  app.post("/core/contacts/:id/restore", async (request) => {
    const session = await ctx.guardSession(app, request);
    const tenantId = requireTenantContext(request, session);
    await ctx.guardActiveTenant(app, tenantId);
    await ctx.guardFeatureEnabled(app, tenantId, "core");
    ctx.guardPermission(session, "core.contact.manage");
    const { id } = request.params as { id: string };
    await app.coreContactService.restore(tenantId, id);
    await auditRecordEvent(app, {
      actorType: "tenant", actorEmail: session.email,
      eventName: "core.contact.restored",
      payload: { contactId: id },
      ...(request.correlationId ? { correlationId: request.correlationId } : {}),
      ...(request.tenantId ? { tenantId: request.tenantId } : {})
    });
    return ok({ restored: true }, responseMeta(request));
  });
}
