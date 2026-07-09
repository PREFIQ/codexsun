import type { FastifyInstance } from "fastify";
import { ok } from "@codexsun/framework/http";
import { resolveBillingDatabaseName } from "../../database/billing-database.js";
import { SalesService } from "./sales.service.js";
import type { SaleSavePayload } from "./sales.types.js";

const salesService = new SalesService();

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
  app.get("/billing/sales", async (request) =>
    ok(await salesService.listSales(tenantDatabaseName(request.headers["x-tenant-db"])), { requestId: request.id })
  );

  app.get("/billing/sales/:id", async (request, reply) => {
    const { id } = request.params as { id: string };
    const sale = await salesService.getSale(tenantDatabaseName(request.headers["x-tenant-db"]), id);
    if (!sale) return reply.code(404).send(notFound(request.id));
    return ok(sale, { requestId: request.id });
  });

  app.post("/billing/sales", async (request) =>
    ok(await salesService.createSale(tenantDatabaseName(request.headers["x-tenant-db"]), request.body as SaleSavePayload), {
      requestId: request.id
    })
  );

  app.put("/billing/sales/:id", async (request, reply) => {
    const { id } = request.params as { id: string };
    const sale = await salesService.updateSale(tenantDatabaseName(request.headers["x-tenant-db"]), id, request.body as SaleSavePayload);
    if (!sale) return reply.code(404).send(notFound(request.id));
    return ok(sale, { requestId: request.id });
  });

  app.post("/billing/sales/:id/confirm", async (request, reply) => {
    const { id } = request.params as { id: string };
    const sale = await salesService.confirmSale(tenantDatabaseName(request.headers["x-tenant-db"]), id);
    if (!sale) return reply.code(404).send(notFound(request.id));
    return ok(sale, { requestId: request.id });
  });

  app.post("/billing/sales/:id/cancel", async (request, reply) => {
    const { id } = request.params as { id: string };
    const sale = await salesService.cancelSale(tenantDatabaseName(request.headers["x-tenant-db"]), id);
    if (!sale) return reply.code(404).send(notFound(request.id));
    return ok(sale, { requestId: request.id });
  });
}

function tenantDatabaseName(value: string | string[] | undefined) {
  return resolveBillingDatabaseName(Array.isArray(value) ? value[0] : value);
}
