import type { FastifyInstance, FastifyRequest } from "fastify";
import { ok } from "@codexsun/framework/http";
import { TaxesService } from "./taxes.service.js";
import type { TaxesListFilters, TaxesSavePayload } from "./taxes.types.js";

export const TAXES_COLLECTION_PATH = "/core/common/products/taxes";
const service = new TaxesService();

export async function registerTaxesRoutes(app: FastifyInstance) {
  app.get(TAXES_COLLECTION_PATH, async (request) =>
    ok(await service.list(filters(request)), { requestId: request.id })
  );
  app.get(`/core/common/products/taxes/:id`, async (request, reply) => {
    const record = await service.get(id(request));
    return record
      ? ok(record, { requestId: request.id })
      : reply.code(404).send(notFound(request.id));
  });
  app.post(TAXES_COLLECTION_PATH, async (request) =>
    ok(await service.create(request.body as TaxesSavePayload), {
      requestId: request.id
    })
  );
  app.put(`/core/common/products/taxes/:id`, async (request) =>
    ok(await service.update(id(request), request.body as TaxesSavePayload), {
      requestId: request.id
    })
  );
  app.post(`/core/common/products/taxes/:id/activate`, async (request) =>
    ok(await service.setActive(id(request), true), { requestId: request.id })
  );
  app.post(`/core/common/products/taxes/:id/deactivate`, async (request) =>
    ok(await service.setActive(id(request), false), { requestId: request.id })
  );
  app.delete(`/core/common/products/taxes/:id/force`, async (request) =>
    ok(await service.forceDelete(id(request)), { requestId: request.id })
  );
}

function id(request: FastifyRequest) {
  return (request.params as { id: string }).id;
}
function filters(request: FastifyRequest): TaxesListFilters {
  const search = (request.query as { search?: string } | undefined)?.search;
  return search ? { search } : {};
}
function notFound(requestId: string) {
  return {
    error: { code: "TAXES_NOT_FOUND", message: "Taxes record was not found." },
    meta: { requestId, timestamp: new Date().toISOString() },
    success: false as const
  };
}
