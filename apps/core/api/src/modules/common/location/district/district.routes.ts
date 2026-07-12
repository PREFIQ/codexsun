import type { FastifyInstance, FastifyRequest } from "fastify";
import { ok } from "@codexsun/framework/http";
import { DistrictService } from "./district.service.js";
import type { DistrictListFilters, DistrictSavePayload } from "./district.types.js";

export const DISTRICT_COLLECTION_PATH = "/core/common/location/districts";
const service = new DistrictService();

export async function registerDistrictRoutes(app: FastifyInstance) {
  app.get(DISTRICT_COLLECTION_PATH, async (request) =>
    ok(await service.list(filters(request)), { requestId: request.id })
  );
  app.get(`${DISTRICT_COLLECTION_PATH}/:id`, async (request, reply) => {
    const record = await service.get(id(request));
    return record
      ? ok(record, { requestId: request.id })
      : reply.code(404).send(notFound(request.id));
  });
  app.post(DISTRICT_COLLECTION_PATH, async (request) =>
    ok(await service.create(request.body as DistrictSavePayload), { requestId: request.id })
  );
  app.put(`${DISTRICT_COLLECTION_PATH}/:id`, async (request) =>
    ok(await service.update(id(request), request.body as DistrictSavePayload), {
      requestId: request.id
    })
  );
  app.post(`${DISTRICT_COLLECTION_PATH}/:id/activate`, async (request) =>
    ok(await service.setStatus(id(request), "active"), { requestId: request.id })
  );
  app.post(`${DISTRICT_COLLECTION_PATH}/:id/deactivate`, async (request) =>
    ok(await service.setStatus(id(request), "inactive"), { requestId: request.id })
  );
  app.delete(`${DISTRICT_COLLECTION_PATH}/:id/force`, async (request) =>
    ok(await service.forceDelete(id(request)), { requestId: request.id })
  );
}

function id(request: FastifyRequest) {
  return (request.params as { id: string }).id;
}
function filters(request: FastifyRequest): DistrictListFilters {
  const query = request.query as DistrictListFilters | undefined;
  return {
    ...(query?.stateId ? { stateId: query.stateId } : {}),
    ...(query?.search ? { search: query.search } : {})
  };
}
function notFound(requestId: string) {
  return {
    error: { code: "DISTRICT_NOT_FOUND", message: "District was not found." },
    meta: { requestId, timestamp: new Date().toISOString() },
    success: false as const
  };
}
