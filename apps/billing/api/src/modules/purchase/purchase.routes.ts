import type { FastifyInstance } from "fastify";
import { ok } from "@codexsun/framework/http";
import { resolveBillingDatabaseName } from "../../database/billing-database.js";
import { PurchaseService } from "./purchase.service.js";
import type { PurchaseSavePayload } from "./purchase.types.js";
import { isPurchaseLookupKind, PurchaseLookupService } from "./purchase.lookup.js";

const purchaseService = new PurchaseService();
const lookups = new PurchaseLookupService();

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
  app.get("/billing/purchase/lookups/:kind", async (request, reply) => {
    const { kind } = request.params as { kind: string };
    if (!isPurchaseLookupKind(kind)) return reply.code(404).send(notFound(request.id));
    return ok(await lookups.list(kind, lookupHeaders(request)), { requestId: request.id });
  });

  app.post("/billing/purchase/lookups/:kind", async (request, reply) => {
    const { kind } = request.params as { kind: string };
    if (!isPurchaseLookupKind(kind)) return reply.code(404).send(notFound(request.id));
    return ok(await lookups.create(kind, lookupHeaders(request), request.body as Record<string, unknown>), { requestId: request.id });
  });

  app.put("/billing/purchase/lookups/:kind/:id", async (request, reply) => {
    const { id, kind } = request.params as { id: string; kind: string };
    if (!(kind === "contacts" || kind === "products" || kind === "workOrders")) return reply.code(404).send(notFound(request.id));
    return ok(await lookups.update(kind, lookupHeaders(request), id, request.body as Record<string, unknown>), { requestId: request.id });
  });

  app.post("/billing/purchase/lookups/locations/:kind", async (request, reply) => {
    const { kind } = request.params as { kind: string };
    if (!(kind === "states" || kind === "districts" || kind === "cities" || kind === "pincodes")) return reply.code(404).send(notFound(request.id));
    return ok(await lookups.create(kind, lookupHeaders(request), request.body as Record<string, unknown>), { requestId: request.id });
  });

  app.post("/billing/purchase/lookups/address-types", async (request) =>
    ok(await lookups.create("addressTypes", lookupHeaders(request), request.body as Record<string, unknown>), { requestId: request.id }),
  );

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

  app.delete("/billing/purchase/:id", async (request, reply) => {
    const { id } = request.params as { id: string };
    const purchase = await purchaseService.deletePurchase(tenantDatabaseName(request.headers["x-tenant-db"]), id);
    if (!purchase) return reply.code(404).send(notFound(request.id));
    return ok(purchase, { requestId: request.id });
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

  app.post("/billing/purchase/:id/revoke", async (request, reply) => {
    const { id } = request.params as { id: string };
    const purchase = await purchaseService.revokePurchase(tenantDatabaseName(request.headers["x-tenant-db"]), id);
    if (!purchase) return reply.code(404).send(notFound(request.id));
    return ok(purchase, { requestId: request.id });
  });
}

function lookupHeaders(request: { headers: Record<string, string | string[] | undefined> }) {
  return {
    ...(request.headers.authorization ? { authorization: request.headers.authorization } : {}),
    ...(request.headers["x-tenant-id"] ? { tenantId: request.headers["x-tenant-id"] } : {}),
  };
}

function tenantDatabaseName(value: string | string[] | undefined) {
  return resolveBillingDatabaseName(Array.isArray(value) ? value[0] : value);
}
