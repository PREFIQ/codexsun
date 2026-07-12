import type { FastifyInstance, FastifyRequest } from "fastify";
import { ok } from "@codexsun/framework/http";
import { SizesService } from "./sizes.service.js";
import type { SizesListFilters, SizesSavePayload } from "./sizes.types.js";

export const SIZES_COLLECTION_PATH = "/core/common/products/sizes";
const service = new SizesService();

export async function registerSizesRoutes(app: FastifyInstance) {
  app.get(SIZES_COLLECTION_PATH, async (request) =>
    ok(await service.list(filters(request)), { requestId: request.id })
  );
  app.get(`/core/common/products/sizes/:id`, async (request, reply) => {
    const record = await service.get(id(request));
    return record
      ? ok(record, { requestId: request.id })
      : reply.code(404).send(notFound(request.id));
  });
  app.post(SIZES_COLLECTION_PATH, async (request) =>
    ok(await service.create(request.body as SizesSavePayload), {
      requestId: request.id
    })
  );
  app.put(`/core/common/products/sizes/:id`, async (request) =>
    ok(await service.update(id(request), request.body as SizesSavePayload), {
      requestId: request.id
    })
  );
  app.post(`/core/common/products/sizes/:id/activate`, async (request) =>
    ok(await service.setActive(id(request), true), { requestId: request.id })
  );
  app.post(`/core/common/products/sizes/:id/deactivate`, async (request) =>
    ok(await service.setActive(id(request), false), { requestId: request.id })
  );
  app.delete(`/core/common/products/sizes/:id/force`, async (request) =>
    ok(await service.forceDelete(id(request)), { requestId: request.id })
  );
}

function id(request: FastifyRequest) {
  return (request.params as { id: string }).id;
}
function filters(request: FastifyRequest): SizesListFilters {
  const search = (request.query as { search?: string } | undefined)?.search;
  return search ? { search } : {};
}
function notFound(requestId: string) {
  return {
    error: { code: "SIZES_NOT_FOUND", message: "Sizes record was not found." },
    meta: { requestId, timestamp: new Date().toISOString() },
    success: false as const
  };
}
