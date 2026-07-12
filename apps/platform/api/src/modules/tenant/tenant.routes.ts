import type { FastifyInstance } from "fastify";
import { ok } from "@codexsun/framework/http";
import { TenantService } from "./tenant.service.js";
import type { TenantSavePayload } from "./tenant.types.js";

const tenantService = new TenantService();

function notFound(requestId: string) {
  return {
    error: {
      code: "TENANT_NOT_FOUND",
      message: "Tenant was not found."
    },
    meta: {
      requestId,
      timestamp: new Date().toISOString()
    },
    success: false as const
  };
}

export async function registerTenantRoutes(app: FastifyInstance) {
  app.get("/admin/tenants", async (request) =>
    ok(await tenantService.listTenants(), { requestId: request.id })
  );

  app.post("/admin/tenants", async (request) =>
    ok(await tenantService.createTenant(request.body as TenantSavePayload), {
      requestId: request.id
    })
  );

  app.put("/admin/tenants/:id", async (request, reply) => {
    const { id } = request.params as { id: string };
    const tenant = await tenantService.updateTenant(id, request.body as TenantSavePayload);
    if (!tenant) return reply.code(404).send(notFound(request.id));
    return ok(tenant, { requestId: request.id });
  });

  app.post("/admin/tenants/:id/suspend", async (request, reply) => {
    const { id } = request.params as { id: string };
    const tenant = await tenantService.suspendTenant(id);
    if (!tenant) return reply.code(404).send(notFound(request.id));
    return ok(tenant, { requestId: request.id });
  });

  app.post("/admin/tenants/:id/restore", async (request, reply) => {
    const { id } = request.params as { id: string };
    const tenant = await tenantService.restoreTenant(id);
    if (!tenant) return reply.code(404).send(notFound(request.id));
    return ok(tenant, { requestId: request.id });
  });

  app.get("/admin/activity/tenant/:id", async (request) => {
    const { id } = request.params as { id: string };
    return ok(await tenantService.listActivity(id), { requestId: request.id });
  });

  app.get("/tenant/runtime", async (request) => {
    const tenantId = String(request.headers["x-tenant-id"] ?? "");
    return ok(await tenantService.getTenantRuntime(tenantId), {
      requestId: request.id,
      ...(tenantId ? { tenantId } : {})
    });
  });
}
