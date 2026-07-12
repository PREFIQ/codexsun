import type { FastifyInstance, FastifyRequest } from "fastify";
import { ok } from "@codexsun/framework/http";
import { StylesService } from "./styles.service.js";
import type { StylesListFilters, StylesSavePayload } from "./styles.types.js";

export const STYLES_COLLECTION_PATH = "/core/common/products/styles";
const service = new StylesService();

export async function registerStylesRoutes(app: FastifyInstance) {
  app.get(STYLES_COLLECTION_PATH, async (request) =>
    ok(await service.list(filters(request)), { requestId: request.id })
  );
  app.get(`/core/common/products/styles/:id`, async (request, reply) => {
    const record = await service.get(id(request));
    return record
      ? ok(record, { requestId: request.id })
      : reply.code(404).send(notFound(request.id));
  });
  app.post(STYLES_COLLECTION_PATH, async (request) =>
    ok(await service.create(request.body as StylesSavePayload), {
      requestId: request.id
    })
  );
  app.put(`/core/common/products/styles/:id`, async (request) =>
    ok(await service.update(id(request), request.body as StylesSavePayload), {
      requestId: request.id
    })
  );
  app.post(`/core/common/products/styles/:id/activate`, async (request) =>
    ok(await service.setActive(id(request), true), { requestId: request.id })
  );
  app.post(`/core/common/products/styles/:id/deactivate`, async (request) =>
    ok(await service.setActive(id(request), false), { requestId: request.id })
  );
  app.delete(`/core/common/products/styles/:id/force`, async (request) =>
    ok(await service.forceDelete(id(request)), { requestId: request.id })
  );
}

function id(request: FastifyRequest) {
  return (request.params as { id: string }).id;
}
function filters(request: FastifyRequest): StylesListFilters {
  const search = (request.query as { search?: string } | undefined)?.search;
  return search ? { search } : {};
}
function notFound(requestId: string) {
  return {
    error: { code: "STYLES_NOT_FOUND", message: "Styles record was not found." },
    meta: { requestId, timestamp: new Date().toISOString() },
    success: false as const
  };
}
