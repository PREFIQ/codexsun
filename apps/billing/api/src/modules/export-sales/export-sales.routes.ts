import type { FastifyInstance } from "fastify";
import { ok } from "@codexsun/framework/http";
import { resolveBillingDatabaseName } from "../../database/billing-database.js";
import { ExportSalesService } from "./export-sales.service.js";
import type { ExportSaleSavePayload } from "./export-sales.types.js";

const exportSalesService = new ExportSalesService();

function notFound(requestId: string) {
  return {
    error: {
      code: "EXPORT_SALE_NOT_FOUND",
      message: "Export sale was not found."
    },
    meta: {
      requestId,
      timestamp: new Date().toISOString()
    },
    success: false as const
  };
}

export async function registerExportSalesRoutes(app: FastifyInstance) {
  app.get("/billing/export-sales", async (request) =>
    ok(await exportSalesService.listExportSales(tenantDatabaseName(request.headers["x-tenant-db"])), { requestId: request.id })
  );

  app.get("/billing/export-sales/:id", async (request, reply) => {
    const { id } = request.params as { id: string };
    const sale = await exportSalesService.getExportSale(tenantDatabaseName(request.headers["x-tenant-db"]), id);
    if (!sale) return reply.code(404).send(notFound(request.id));
    return ok(sale, { requestId: request.id });
  });

  app.post("/billing/export-sales", async (request) =>
    ok(await exportSalesService.createExportSale(tenantDatabaseName(request.headers["x-tenant-db"]), request.body as ExportSaleSavePayload), {
      requestId: request.id
    })
  );

  app.put("/billing/export-sales/:id", async (request, reply) => {
    const { id } = request.params as { id: string };
    const sale = await exportSalesService.updateExportSale(tenantDatabaseName(request.headers["x-tenant-db"]), id, request.body as ExportSaleSavePayload);
    if (!sale) return reply.code(404).send(notFound(request.id));
    return ok(sale, { requestId: request.id });
  });

  app.post("/billing/export-sales/:id/confirm", async (request, reply) => {
    const { id } = request.params as { id: string };
    const sale = await exportSalesService.confirmExportSale(tenantDatabaseName(request.headers["x-tenant-db"]), id);
    if (!sale) return reply.code(404).send(notFound(request.id));
    return ok(sale, { requestId: request.id });
  });

  app.post("/billing/export-sales/:id/cancel", async (request, reply) => {
    const { id } = request.params as { id: string };
    const sale = await exportSalesService.cancelExportSale(tenantDatabaseName(request.headers["x-tenant-db"]), id);
    if (!sale) return reply.code(404).send(notFound(request.id));
    return ok(sale, { requestId: request.id });
  });
}

function tenantDatabaseName(value: string | string[] | undefined) {
  return resolveBillingDatabaseName(Array.isArray(value) ? value[0] : value);
}
