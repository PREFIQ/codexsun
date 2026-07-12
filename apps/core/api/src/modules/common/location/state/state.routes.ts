import type { FastifyInstance, FastifyRequest } from "fastify";
import { ok } from "@codexsun/framework/http";
import { StateService } from "./state.service.js";
import type { StateListFilters, StateSavePayload } from "./state.types.js";

export const STATE_COLLECTION_PATH = "/core/common/location/states";
const service = new StateService();

export async function registerStateRoutes(app: FastifyInstance) {
  app.get(STATE_COLLECTION_PATH, async (request) =>
    ok(await service.list(filters(request)), { requestId: request.id })
  );
  app.get(`${STATE_COLLECTION_PATH}/:id`, async (request, reply) => {
    const record = await service.get(id(request));
    return record
      ? ok(record, { requestId: request.id })
      : reply.code(404).send(notFound(request.id));
  });
  app.post(STATE_COLLECTION_PATH, async (request) =>
    ok(await service.create(request.body as StateSavePayload), { requestId: request.id })
  );
  app.put(`${STATE_COLLECTION_PATH}/:id`, async (request) =>
    ok(await service.update(id(request), request.body as StateSavePayload), {
      requestId: request.id
    })
  );
  app.post(`${STATE_COLLECTION_PATH}/:id/activate`, async (request) =>
    ok(await service.setStatus(id(request), "active"), { requestId: request.id })
  );
  app.post(`${STATE_COLLECTION_PATH}/:id/deactivate`, async (request) =>
    ok(await service.setStatus(id(request), "inactive"), { requestId: request.id })
  );
  app.delete(`${STATE_COLLECTION_PATH}/:id/force`, async (request) =>
    ok(await service.forceDelete(id(request)), { requestId: request.id })
  );
}

function id(request: FastifyRequest) {
  return (request.params as { id: string }).id;
}
function filters(request: FastifyRequest): StateListFilters {
  const query = request.query as StateListFilters | undefined;
  return {
    ...(query?.countryId ? { countryId: query.countryId } : {}),
    ...(query?.search ? { search: query.search } : {})
  };
}
function notFound(requestId: string) {
  return {
    error: { code: "STATE_NOT_FOUND", message: "State was not found." },
    meta: { requestId, timestamp: new Date().toISOString() },
    success: false as const
  };
}
