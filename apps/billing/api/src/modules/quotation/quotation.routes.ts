import type { FastifyInstance } from "fastify";
import { ok } from "@codexsun/framework/http";
import { resolveBillingDatabaseName } from "../../database/billing-database.js";
import { QuotationService } from "./quotation.service.js";
import type { QuotationSavePayload } from "./quotation.types.js";

const service = new QuotationService();

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
  app.get("/billing/quotations", async (request) =>
    ok(await service.list(databaseName(request.headers["x-tenant-db"])), { requestId: request.id }),
  );

  app.get("/billing/quotations/:id", async (request, reply) => {
    const { id } = request.params as { id: string };
    const entry = await service.get(databaseName(request.headers["x-tenant-db"]), id);
    if (!entry) return reply.code(404).send(notFound(request.id));
    return ok(entry, { requestId: request.id });
  });

  app.post("/billing/quotations", async (request) =>
    ok(await service.create(databaseName(request.headers["x-tenant-db"]), request.body as QuotationSavePayload), { requestId: request.id }),
  );

  app.put("/billing/quotations/:id", async (request, reply) => {
    const { id } = request.params as { id: string };
    const entry = await service.update(databaseName(request.headers["x-tenant-db"]), id, request.body as QuotationSavePayload);
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
}

function databaseName(value: string | string[] | undefined) {
  return resolveBillingDatabaseName(Array.isArray(value) ? value[0] : value);
}
