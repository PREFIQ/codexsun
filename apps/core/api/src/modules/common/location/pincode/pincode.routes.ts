import type { FastifyInstance, FastifyRequest } from "fastify";
import { ok } from "@codexsun/framework/http";
import { PincodeService } from "./pincode.service.js";
import type { PincodeListFilters, PincodeSavePayload } from "./pincode.types.js";

export const PINCODE_COLLECTION_PATH = "/core/common/location/pincodes";
export const PINCODE_RELATIONS_PATH = `${PINCODE_COLLECTION_PATH}/relations`;
const service = new PincodeService();

export async function registerPincodeRoutes(app: FastifyInstance) {
  app.get(PINCODE_COLLECTION_PATH, async (request) =>
    ok(await service.list(filters(request)), { requestId: request.id })
  );
  app.get(PINCODE_RELATIONS_PATH, async (request) =>
    ok(await service.listWithRelations(filters(request)), { requestId: request.id })
  );
  app.get(`${PINCODE_RELATIONS_PATH}/:id`, async (request, reply) => {
    const record = await service.getWithRelations(id(request));
    return record
      ? ok(record, { requestId: request.id })
      : reply.code(404).send(notFound(request.id));
  });
  app.get(`${PINCODE_COLLECTION_PATH}/:id`, async (request, reply) => {
    const record = await service.get(id(request));
    return record
      ? ok(record, { requestId: request.id })
      : reply.code(404).send(notFound(request.id));
  });
  app.post(PINCODE_COLLECTION_PATH, async (request) =>
    ok(await service.create(request.body as PincodeSavePayload), { requestId: request.id })
  );
  app.put(`${PINCODE_COLLECTION_PATH}/:id`, async (request) =>
    ok(await service.update(id(request), request.body as PincodeSavePayload), {
      requestId: request.id
    })
  );
  app.post(`${PINCODE_COLLECTION_PATH}/:id/activate`, async (request) =>
    ok(await service.setStatus(id(request), "active"), { requestId: request.id })
  );
  app.post(`${PINCODE_COLLECTION_PATH}/:id/deactivate`, async (request) =>
    ok(await service.setStatus(id(request), "inactive"), { requestId: request.id })
  );
  app.delete(`${PINCODE_COLLECTION_PATH}/:id/force`, async (request) =>
    ok(await service.forceDelete(id(request)), { requestId: request.id })
  );
}

function id(request: FastifyRequest) {
  return (request.params as { id: string }).id;
}
function filters(request: FastifyRequest): PincodeListFilters {
  const query = request.query as PincodeListFilters | undefined;
  return {
    ...(query?.cityId ? { cityId: query.cityId } : {}),
    ...(query?.search ? { search: query.search } : {})
  };
}
function notFound(requestId: string) {
  return {
    error: { code: "PINCODE_NOT_FOUND", message: "Pincode was not found." },
    meta: { requestId, timestamp: new Date().toISOString() },
    success: false as const
  };
}
