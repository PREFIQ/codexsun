import type { FastifyInstance } from "fastify";
import { ok } from "@codexsun/framework/http";
import { resolveBillingDatabaseName } from "../../database/billing-database.js";
import { ExportSalesService } from "./export-sales.service.js";
import { ExportSalesLookupService, isExportSalesLookupKind } from "./export-sales.lookup.js";
import type { ExportSaleSavePayload } from "./export-sales.types.js";

const exportSalesService = new ExportSalesService();
const lookups = new ExportSalesLookupService();

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
  app.get("/billing/export-sales/lookups/:kind", async (request, reply) => {
    const { kind } = request.params as { kind: string };
    if (!isExportSalesLookupKind(kind)) return reply.code(404).send(notFound(request.id));
    return ok(await lookups.list(kind, lookupHeaders(request)), { requestId: request.id });
  });

  app.post("/billing/export-sales/lookups/contacts", async (request) =>
    ok(
      await lookups.createContact(lookupHeaders(request), request.body as Record<string, unknown>),
      { requestId: request.id }
    )
  );

  app.put("/billing/export-sales/lookups/contacts/:id", async (request) => {
    const { id } = request.params as { id: string };
    return ok(
      await lookups.updateContact(
        lookupHeaders(request),
        id,
        request.body as Record<string, unknown>
      ),
      { requestId: request.id }
    );
  });

  app.post("/billing/export-sales/lookups/locations/:kind", async (request, reply) => {
    const { kind } = request.params as { kind: string };
    if (!(kind === "states" || kind === "districts" || kind === "cities" || kind === "pincodes"))
      return reply.code(404).send(notFound(request.id));
    return ok(
      await lookups.createLocation(
        kind,
        lookupHeaders(request),
        request.body as Record<string, unknown>
      ),
      { requestId: request.id }
    );
  });

  app.post("/billing/export-sales/lookups/address-types", async (request) =>
    ok(
      await lookups.createAddressType(
        lookupHeaders(request),
        request.body as Record<string, unknown>
      ),
      { requestId: request.id }
    )
  );

  app.post("/billing/export-sales/lookups/:kind", async (request, reply) => {
    const { kind } = request.params as { kind: string };
    if (!(
      kind === "colours" ||
      kind === "products" ||
      kind === "sizes" ||
      kind === "workOrders" ||
      kind === "productCategories" ||
      kind === "hsnCodes" ||
      kind === "units" ||
      kind === "taxes"
    ))
      return reply.code(404).send(notFound(request.id));
    return ok(
      await lookups.createLookup(
        kind,
        lookupHeaders(request),
        request.body as Record<string, unknown>
      ),
      { requestId: request.id }
    );
  });

  app.put("/billing/export-sales/lookups/:kind/:id", async (request, reply) => {
    const { id, kind } = request.params as { id: string; kind: string };
    if (!(kind === "products" || kind === "workOrders"))
      return reply.code(404).send(notFound(request.id));
    return ok(
      await lookups.updateLookup(
        kind,
        lookupHeaders(request),
        id,
        request.body as Record<string, unknown>
      ),
      { requestId: request.id }
    );
  });

  app.get("/billing/export-sales", async (request) =>
    ok(
      await exportSalesService.listExportSales(tenantDatabaseName(request.headers["x-tenant-db"])),
      { requestId: request.id }
    )
  );

  app.get("/billing/export-sales/:id", async (request, reply) => {
    const { id } = request.params as { id: string };
    const sale = await exportSalesService.getExportSale(
      tenantDatabaseName(request.headers["x-tenant-db"]),
      id
    );
    if (!sale) return reply.code(404).send(notFound(request.id));
    return ok(sale, { requestId: request.id });
  });

  app.post("/billing/export-sales", async (request) =>
    ok(
      await exportSalesService.createExportSale(
        tenantDatabaseName(request.headers["x-tenant-db"]),
        request.body as ExportSaleSavePayload
      ),
      {
        requestId: request.id
      }
    )
  );

  app.put("/billing/export-sales/:id", async (request, reply) => {
    const { id } = request.params as { id: string };
    const sale = await exportSalesService.updateExportSale(
      tenantDatabaseName(request.headers["x-tenant-db"]),
      id,
      request.body as ExportSaleSavePayload
    );
    if (!sale) return reply.code(404).send(notFound(request.id));
    return ok(sale, { requestId: request.id });
  });

  app.post("/billing/export-sales/:id/confirm", async (request, reply) => {
    const { id } = request.params as { id: string };
    const sale = await exportSalesService.confirmExportSale(
      tenantDatabaseName(request.headers["x-tenant-db"]),
      id
    );
    if (!sale) return reply.code(404).send(notFound(request.id));
    return ok(sale, { requestId: request.id });
  });

  app.post("/billing/export-sales/:id/cancel", async (request, reply) => {
    const { id } = request.params as { id: string };
    const sale = await exportSalesService.cancelExportSale(
      tenantDatabaseName(request.headers["x-tenant-db"]),
      id
    );
    if (!sale) return reply.code(404).send(notFound(request.id));
    return ok(sale, { requestId: request.id });
  });

  app.post("/billing/export-sales/:id/revoke", async (request, reply) => {
    const { id } = request.params as { id: string };
    const sale = await exportSalesService.revokeExportSale(
      tenantDatabaseName(request.headers["x-tenant-db"]),
      id
    );
    if (!sale) return reply.code(404).send(notFound(request.id));
    return ok(sale, { requestId: request.id });
  });

  app.delete("/billing/export-sales/:id", async (request, reply) => {
    const { id } = request.params as { id: string };
    const sale = await exportSalesService.deleteExportSale(
      tenantDatabaseName(request.headers["x-tenant-db"]),
      id
    );
    if (!sale) return reply.code(404).send(notFound(request.id));
    return ok(sale, { requestId: request.id });
  });
}

function tenantDatabaseName(value: string | string[] | undefined) {
  return resolveBillingDatabaseName(Array.isArray(value) ? value[0] : value);
}

function lookupHeaders(request: { headers: Record<string, string | string[] | undefined> }) {
  return {
    ...(request.headers.authorization ? { authorization: request.headers.authorization } : {}),
    ...(request.headers["x-tenant-id"] ? { tenantId: request.headers["x-tenant-id"] } : {})
  };
}
