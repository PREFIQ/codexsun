import type { FastifyInstance, FastifyRequest } from "fastify";
import { ok } from "@codexsun/framework/http";
import { HsnCodesService } from "./hsn-codes.service.js";
import type { HsnCodesListFilters, HsnCodesSavePayload } from "./hsn-codes.types.js";

export const HSN_CODES_COLLECTION_PATH = "/core/common/products/hsn-codes";
const service = new HsnCodesService();

export async function registerHsnCodesRoutes(app: FastifyInstance) {
  app.get(HSN_CODES_COLLECTION_PATH, async (request) =>
    ok(await service.list(filters(request)), { requestId: request.id })
  );
  app.get(`/core/common/products/hsn-codes/:id`, async (request, reply) => {
    const record = await service.get(id(request));
    return record
      ? ok(record, { requestId: request.id })
      : reply.code(404).send(notFound(request.id));
  });
  app.post(HSN_CODES_COLLECTION_PATH, async (request) =>
    ok(await service.create(request.body as HsnCodesSavePayload), {
      requestId: request.id
    })
  );
  app.put(`/core/common/products/hsn-codes/:id`, async (request) =>
    ok(await service.update(id(request), request.body as HsnCodesSavePayload), {
      requestId: request.id
    })
  );
  app.post(`/core/common/products/hsn-codes/:id/activate`, async (request) =>
    ok(await service.setActive(id(request), true), { requestId: request.id })
  );
  app.post(`/core/common/products/hsn-codes/:id/deactivate`, async (request) =>
    ok(await service.setActive(id(request), false), { requestId: request.id })
  );
  app.delete(`/core/common/products/hsn-codes/:id/force`, async (request) =>
    ok(await service.forceDelete(id(request)), { requestId: request.id })
  );
}

function id(request: FastifyRequest) {
  return (request.params as { id: string }).id;
}
function filters(request: FastifyRequest): HsnCodesListFilters {
  const search = (request.query as { search?: string } | undefined)?.search;
  return search ? { search } : {};
}
function notFound(requestId: string) {
  return {
    error: { code: "HSN_CODES_NOT_FOUND", message: "HSN Codes record was not found." },
    meta: { requestId, timestamp: new Date().toISOString() },
    success: false as const
  };
}
