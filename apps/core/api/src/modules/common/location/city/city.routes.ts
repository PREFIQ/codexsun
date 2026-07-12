import type { FastifyInstance, FastifyRequest } from "fastify";
import { ok } from "@codexsun/framework/http";
import { CityService } from "./city.service.js";
import type { CityListFilters, CitySavePayload } from "./city.types.js";

export const CITY_COLLECTION_PATH = "/core/common/location/cities";
const service = new CityService();

export async function registerCityRoutes(app: FastifyInstance) {
  app.get(CITY_COLLECTION_PATH, async (request) =>
    ok(await service.list(filters(request)), { requestId: request.id })
  );
  app.get(`${CITY_COLLECTION_PATH}/:id`, async (request, reply) => {
    const record = await service.get(id(request));
    return record
      ? ok(record, { requestId: request.id })
      : reply.code(404).send(notFound(request.id));
  });
  app.post(CITY_COLLECTION_PATH, async (request) =>
    ok(await service.create(request.body as CitySavePayload), { requestId: request.id })
  );
  app.put(`${CITY_COLLECTION_PATH}/:id`, async (request) =>
    ok(await service.update(id(request), request.body as CitySavePayload), {
      requestId: request.id
    })
  );
  app.post(`${CITY_COLLECTION_PATH}/:id/activate`, async (request) =>
    ok(await service.setStatus(id(request), "active"), { requestId: request.id })
  );
  app.post(`${CITY_COLLECTION_PATH}/:id/deactivate`, async (request) =>
    ok(await service.setStatus(id(request), "inactive"), { requestId: request.id })
  );
  app.delete(`${CITY_COLLECTION_PATH}/:id/force`, async (request) =>
    ok(await service.forceDelete(id(request)), { requestId: request.id })
  );
}

function id(request: FastifyRequest) {
  return (request.params as { id: string }).id;
}
function filters(request: FastifyRequest): CityListFilters {
  const query = request.query as CityListFilters | undefined;
  return {
    ...(query?.districtId ? { districtId: query.districtId } : {}),
    ...(query?.search ? { search: query.search } : {})
  };
}
function notFound(requestId: string) {
  return {
    error: { code: "CITY_NOT_FOUND", message: "City was not found." },
    meta: { requestId, timestamp: new Date().toISOString() },
    success: false as const
  };
}
