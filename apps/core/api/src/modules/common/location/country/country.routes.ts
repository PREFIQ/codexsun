import type { FastifyInstance, FastifyRequest } from "fastify";
import { ok } from "@codexsun/framework/http";
import { CountryService } from "./country.service.js";
import type { CountrySavePayload } from "./country.types.js";

export const COUNTRY_COLLECTION_PATH = "/core/common/location/countries";
const service = new CountryService();

export async function registerCountryRoutes(app: FastifyInstance) {
  app.get(COUNTRY_COLLECTION_PATH, async (request) =>
    ok(await service.list(filters(request)), { requestId: request.id })
  );
  app.get(`${COUNTRY_COLLECTION_PATH}/:id`, async (request, reply) => {
    const record = await service.get(id(request));
    return record
      ? ok(record, { requestId: request.id })
      : reply.code(404).send(notFound(request.id));
  });
  app.post(COUNTRY_COLLECTION_PATH, async (request) =>
    ok(await service.create(request.body as CountrySavePayload), { requestId: request.id })
  );
  app.put(`${COUNTRY_COLLECTION_PATH}/:id`, async (request) =>
    ok(await service.update(id(request), request.body as CountrySavePayload), {
      requestId: request.id
    })
  );
  app.post(`${COUNTRY_COLLECTION_PATH}/:id/activate`, async (request) =>
    ok(await service.setStatus(id(request), "active"), { requestId: request.id })
  );
  app.post(`${COUNTRY_COLLECTION_PATH}/:id/deactivate`, async (request) =>
    ok(await service.setStatus(id(request), "inactive"), { requestId: request.id })
  );
  app.delete(`${COUNTRY_COLLECTION_PATH}/:id/force`, async (request) =>
    ok(await service.forceDelete(id(request)), { requestId: request.id })
  );
}

function id(request: FastifyRequest) {
  return (request.params as { id: string }).id;
}
function filters(request: FastifyRequest) {
  const search = (request.query as { search?: string } | undefined)?.search;
  return search ? { search } : {};
}
function notFound(requestId: string) {
  return {
    error: { code: "COUNTRY_NOT_FOUND", message: "Country was not found." },
    meta: { requestId, timestamp: new Date().toISOString() },
    success: false as const
  };
}
