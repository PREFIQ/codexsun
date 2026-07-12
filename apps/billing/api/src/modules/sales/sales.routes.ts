import type { FastifyInstance } from "fastify";
import { ok } from "@codexsun/framework/http";
import { resolveBillingDatabaseName } from "../../database/billing-database.js";
import { SalesService } from "./sales.service.js";
import { isSaleLookupKind, SaleLookupService } from "./sales.lookup.js";
import type { SaleSavePayload } from "./sales.types.js";

const salesService = new SalesService();
const lookups = new SaleLookupService();

function notFound(requestId: string) {
  return {
    error: {
      code: "SALE_NOT_FOUND",
      message: "Sale was not found."
    },
    meta: {
      requestId,
      timestamp: new Date().toISOString()
    },
    success: false as const
  };
}

export async function registerSalesRoutes(app: FastifyInstance) {
  app.get("/billing/sales/lookups/:kind", async (request, reply) => {
    const { kind } = request.params as { kind: string };
    if (!isSaleLookupKind(kind)) return reply.code(404).send(notFound(request.id));
    return ok(await lookups.list(kind, lookupHeaders(request)), { requestId: request.id });
  });

  app.post("/billing/sales/lookups/:kind", async (request, reply) => {
    const { kind } = request.params as { kind: string };
    if (!isSaleLookupKind(kind)) return reply.code(404).send(notFound(request.id));
    return ok(
      await lookups.create(kind, lookupHeaders(request), request.body as Record<string, unknown>),
      { requestId: request.id }
    );
  });

  app.post("/billing/sales/lookups/locations/:kind", async (request, reply) => {
    const { kind } = request.params as { kind: string };
    if (!(kind === "states" || kind === "districts" || kind === "cities" || kind === "pincodes"))
      return reply.code(404).send(notFound(request.id));
    return ok(
      await lookups.create(kind, lookupHeaders(request), request.body as Record<string, unknown>),
      { requestId: request.id }
    );
  });

  app.post("/billing/sales/lookups/address-types", async (request) =>
    ok(
      await lookups.create(
        "addressTypes",
        lookupHeaders(request),
        request.body as Record<string, unknown>
      ),
      { requestId: request.id }
    )
  );

  app.put("/billing/sales/lookups/:kind/:id", async (request, reply) => {
    const { id, kind } = request.params as { id: string; kind: string };
    if (!(kind === "contacts" || kind === "products" || kind === "workOrders"))
      return reply.code(404).send(notFound(request.id));
    return ok(
      await lookups.update(
        kind,
        lookupHeaders(request),
        id,
        request.body as Record<string, unknown>
      ),
      { requestId: request.id }
    );
  });

  app.get("/billing/sales", async (request) =>
    ok(await salesService.listSales(tenantDatabaseName(request.headers["x-tenant-db"])), {
      requestId: request.id
    })
  );

  app.get("/billing/sales/:id", async (request, reply) => {
    const { id } = request.params as { id: string };
    const sale = await salesService.getSale(tenantDatabaseName(request.headers["x-tenant-db"]), id);
    if (!sale) return reply.code(404).send(notFound(request.id));
    return ok(sale, { requestId: request.id });
  });

  app.post("/billing/sales", async (request) =>
    ok(
      await salesService.createSale(
        tenantDatabaseName(request.headers["x-tenant-db"]),
        request.body as SaleSavePayload
      ),
      {
        requestId: request.id
      }
    )
  );

  app.put("/billing/sales/:id", async (request, reply) => {
    const { id } = request.params as { id: string };
    const sale = await salesService.updateSale(
      tenantDatabaseName(request.headers["x-tenant-db"]),
      id,
      request.body as SaleSavePayload
    );
    if (!sale) return reply.code(404).send(notFound(request.id));
    return ok(sale, { requestId: request.id });
  });

  app.post("/billing/sales/:id/confirm", async (request, reply) => {
    const { id } = request.params as { id: string };
    const sale = await salesService.confirmSale(
      tenantDatabaseName(request.headers["x-tenant-db"]),
      id
    );
    if (!sale) return reply.code(404).send(notFound(request.id));
    return ok(sale, { requestId: request.id });
  });

  app.post("/billing/sales/:id/cancel", async (request, reply) => {
    const { id } = request.params as { id: string };
    const sale = await salesService.cancelSale(
      tenantDatabaseName(request.headers["x-tenant-db"]),
      id
    );
    if (!sale) return reply.code(404).send(notFound(request.id));
    return ok(sale, { requestId: request.id });
  });

  app.post("/billing/sales/:id/einvoice/generate", async (request, reply) => {
    const { id } = request.params as { id: string };
    const body = request.body as { einvoice?: SaleSavePayload["einvoice"] } | undefined;
    const sale = await salesService.generateEinvoice(
      tenantDatabaseName(request.headers["x-tenant-db"]),
      id,
      body?.einvoice
    );
    if (!sale) return reply.code(404).send(notFound(request.id));
    return ok(sale, { requestId: request.id });
  });

  app.post("/billing/sales/:id/eway/generate", async (request, reply) => {
    const { id } = request.params as { id: string };
    const body = request.body as { eway?: SaleSavePayload["eway"] } | undefined;
    const sale = await salesService.generateEway(
      tenantDatabaseName(request.headers["x-tenant-db"]),
      id,
      body?.eway
    );
    if (!sale) return reply.code(404).send(notFound(request.id));
    return ok(sale, { requestId: request.id });
  });
}

function lookupHeaders(request: { headers: Record<string, string | string[] | undefined> }) {
  return {
    ...(request.headers.authorization ? { authorization: request.headers.authorization } : {}),
    ...(request.headers["x-tenant-id"] ? { tenantId: request.headers["x-tenant-id"] } : {})
  };
}

function tenantDatabaseName(value: string | string[] | undefined) {
  return resolveBillingDatabaseName(Array.isArray(value) ? value[0] : value);
}
