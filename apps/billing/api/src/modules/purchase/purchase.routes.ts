import type { FastifyInstance } from "fastify";
import { ok } from "@codexsun/framework/http";
import { resolveBillingDatabaseName } from "../../database/billing-database.js";
import { PurchaseService } from "./purchase.service.js";
import type { PurchaseSavePayload } from "./purchase.types.js";

const purchaseService = new PurchaseService();

function notFound(requestId: string) {
  return {
    error: {
      code: "PURCHASE_NOT_FOUND",
      message: "Purchase was not found."
    },
    meta: {
      requestId,
      timestamp: new Date().toISOString()
    },
    success: false as const
  };
}

export async function registerPurchaseRoutes(app: FastifyInstance) {
  app.get("/billing/purchase", async (request) =>
    ok(await purchaseService.listPurchases(tenantDatabaseName(request.headers["x-tenant-db"])), { requestId: request.id })
  );

  app.get("/billing/purchase/:id", async (request, reply) => {
    const { id } = request.params as { id: string };
    const sale = await purchaseService.getPurchase(tenantDatabaseName(request.headers["x-tenant-db"]), id);
    if (!sale) return reply.code(404).send(notFound(request.id));
    return ok(sale, { requestId: request.id });
  });

  app.post("/billing/purchase", async (request) =>
    ok(await purchaseService.createPurchase(tenantDatabaseName(request.headers["x-tenant-db"]), request.body as PurchaseSavePayload), {
      requestId: request.id
    })
  );

  app.put("/billing/purchase/:id", async (request, reply) => {
    const { id } = request.params as { id: string };
    const sale = await purchaseService.updatePurchase(tenantDatabaseName(request.headers["x-tenant-db"]), id, request.body as PurchaseSavePayload);
    if (!sale) return reply.code(404).send(notFound(request.id));
    return ok(sale, { requestId: request.id });
  });

  app.post("/billing/purchase/:id/confirm", async (request, reply) => {
    const { id } = request.params as { id: string };
    const sale = await purchaseService.confirmPurchase(tenantDatabaseName(request.headers["x-tenant-db"]), id);
    if (!sale) return reply.code(404).send(notFound(request.id));
    return ok(sale, { requestId: request.id });
  });

  app.post("/billing/purchase/:id/cancel", async (request, reply) => {
    const { id } = request.params as { id: string };
    const sale = await purchaseService.cancelPurchase(tenantDatabaseName(request.headers["x-tenant-db"]), id);
    if (!sale) return reply.code(404).send(notFound(request.id));
    return ok(sale, { requestId: request.id });
  });
}

function tenantDatabaseName(value: string | string[] | undefined) {
  return resolveBillingDatabaseName(Array.isArray(value) ? value[0] : value);
}
