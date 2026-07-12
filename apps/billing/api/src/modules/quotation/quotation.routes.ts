import type { FastifyInstance } from "fastify";
import { ok } from "@codexsun/framework/http";
import { resolveBillingDatabaseName } from "../../database/billing-database.js";
import { QuotationService } from "./quotation.service.js";
import { isQuotationLookupKind, QuotationLookupService } from "./quotation.lookup.js";
import type { QuotationSavePayload } from "./quotation.types.js";

const service = new QuotationService();
const lookups = new QuotationLookupService();

function notFound(requestId: string) {
  return {
    error: {
      code: "QUOTATION_NOT_FOUND",
      message: "Quotation was not found."
    },
    meta: {
      requestId,
      timestamp: new Date().toISOString()
    },
    success: false as const
  };
}

export async function registerQuotationRoutes(app: FastifyInstance) {
  app.get("/billing/quotations/lookups/:kind", async (request, reply) => {
    const { kind } = request.params as { kind: string };
    if (!isQuotationLookupKind(kind)) return reply.code(404).send(notFound(request.id));
    return ok(
      await lookups.list(kind, {
        ...(request.headers.authorization ? { authorization: request.headers.authorization } : {}),
        ...(request.headers["x-tenant-id"] ? { tenantId: request.headers["x-tenant-id"] } : {})
      }),
      { requestId: request.id }
    );
  });

  app.post("/billing/quotations/lookups/contacts", async (request) =>
    ok(
      await lookups.createContact(lookupHeaders(request), request.body as Record<string, unknown>),
      { requestId: request.id }
    )
  );

  app.put("/billing/quotations/lookups/contacts/:id", async (request) => {
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

  app.post("/billing/quotations/lookups/locations/:kind", async (request, reply) => {
    const { kind } = request.params as { kind: string };
    if (!["states", "districts", "cities", "pincodes"].includes(kind))
      return reply.code(404).send(notFound(request.id));
    return ok(
      await lookups.createLocation(
        kind as "states" | "districts" | "cities" | "pincodes",
        lookupHeaders(request),
        request.body as Record<string, unknown>
      ),
      { requestId: request.id }
    );
  });

  app.post("/billing/quotations/lookups/address-types", async (request) =>
    ok(
      await lookups.createAddressType(
        lookupHeaders(request),
        request.body as Record<string, unknown>
      ),
      { requestId: request.id }
    )
  );

  app.post("/billing/quotations/lookups/:kind", async (request, reply) => {
    const { kind } = request.params as { kind: string };
    if (
      ![
        "colours",
        "products",
        "sizes",
        "workOrders",
        "productCategories",
        "hsnCodes",
        "units",
        "taxes"
      ].includes(kind)
    )
      return reply.code(404).send(notFound(request.id));
    return ok(
      await lookups.createLookup(
        kind as
          | "colours"
          | "products"
          | "sizes"
          | "workOrders"
          | "productCategories"
          | "hsnCodes"
          | "units"
          | "taxes",
        lookupHeaders(request),
        request.body as Record<string, unknown>
      ),
      { requestId: request.id }
    );
  });

  app.put("/billing/quotations/lookups/:kind/:id", async (request, reply) => {
    const { id, kind } = request.params as { id: string; kind: string };
    if (!["products", "workOrders"].includes(kind))
      return reply.code(404).send(notFound(request.id));
    return ok(
      await lookups.updateLookup(
        kind as "products" | "workOrders",
        lookupHeaders(request),
        id,
        request.body as Record<string, unknown>
      ),
      { requestId: request.id }
    );
  });

  app.get("/billing/quotations", async (request) =>
    ok(await service.list(databaseName(request.headers["x-tenant-db"])), { requestId: request.id })
  );

  app.get("/billing/quotations/:id", async (request, reply) => {
    const { id } = request.params as { id: string };
    const entry = await service.get(databaseName(request.headers["x-tenant-db"]), id);
    if (!entry) return reply.code(404).send(notFound(request.id));
    return ok(entry, { requestId: request.id });
  });

  app.post("/billing/quotations", async (request) =>
    ok(
      await service.create(
        databaseName(request.headers["x-tenant-db"]),
        request.body as QuotationSavePayload
      ),
      { requestId: request.id }
    )
  );

  app.put("/billing/quotations/:id", async (request, reply) => {
    const { id } = request.params as { id: string };
    const entry = await service.update(
      databaseName(request.headers["x-tenant-db"]),
      id,
      request.body as QuotationSavePayload
    );
    if (!entry) return reply.code(404).send(notFound(request.id));
    return ok(entry, { requestId: request.id });
  });

  app.post("/billing/quotations/:id/confirm", async (request, reply) => {
    const { id } = request.params as { id: string };
    const entry = await service.confirm(databaseName(request.headers["x-tenant-db"]), id);
    if (!entry) return reply.code(404).send(notFound(request.id));
    return ok(entry, { requestId: request.id });
  });

  app.post("/billing/quotations/:id/cancel", async (request, reply) => {
    const { id } = request.params as { id: string };
    const entry = await service.cancel(databaseName(request.headers["x-tenant-db"]), id);
    if (!entry) return reply.code(404).send(notFound(request.id));
    return ok(entry, { requestId: request.id });
  });

  app.post("/billing/quotations/:id/revoke", async (request, reply) => {
    const { id } = request.params as { id: string };
    const entry = await service.revoke(databaseName(request.headers["x-tenant-db"]), id);
    if (!entry) return reply.code(404).send(notFound(request.id));
    return ok(entry, { requestId: request.id });
  });

  app.delete("/billing/quotations/:id", async (request, reply) => {
    const { id } = request.params as { id: string };
    const entry = await service.deleteDraft(databaseName(request.headers["x-tenant-db"]), id);
    if (!entry) return reply.code(404).send(notFound(request.id));
    return ok(entry, { requestId: request.id });
  });

  app.post("/billing/quotations/:id/convert-to-sale", async (request, reply) => {
    const { id } = request.params as { id: string };
    const result = await service.convertToSale(databaseName(request.headers["x-tenant-db"]), id);
    if (!result) return reply.code(404).send(notFound(request.id));
    return ok(result, { requestId: request.id });
  });

  app.post("/billing/quotations/convert-to-sale", async (request) => {
    const body = request.body as { quotationIds?: unknown };
    const quotationIds = Array.isArray(body?.quotationIds)
      ? body.quotationIds.filter((id): id is string => typeof id === "string")
      : [];
    return ok(
      await service.convertManyToSale(databaseName(request.headers["x-tenant-db"]), quotationIds),
      { requestId: request.id }
    );
  });
}

function databaseName(value: string | string[] | undefined) {
  return resolveBillingDatabaseName(Array.isArray(value) ? value[0] : value);
}

function lookupHeaders(request: {
  headers: { authorization?: string | undefined; "x-tenant-id"?: string | string[] | undefined };
}) {
  return {
    ...(request.headers.authorization ? { authorization: request.headers.authorization } : {}),
    ...(request.headers["x-tenant-id"] ? { tenantId: request.headers["x-tenant-id"] } : {})
  };
}
