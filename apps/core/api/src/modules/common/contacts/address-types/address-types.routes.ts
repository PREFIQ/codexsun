import type { FastifyInstance, FastifyRequest } from "fastify";
import { ok } from "@codexsun/framework/http";
import { AddressTypesService } from "./address-types.service.js";
import type { AddressTypesListFilters, AddressTypesSavePayload } from "./address-types.types.js";

export const ADDRESS_TYPES_COLLECTION_PATH = "/core/common/contacts/address-types";
const service = new AddressTypesService();

export async function registerAddressTypesRoutes(app: FastifyInstance) {
  app.get(ADDRESS_TYPES_COLLECTION_PATH, async (request) =>
    ok(await service.list(filters(request)), { requestId: request.id })
  );
  app.get(`/core/common/contacts/address-types/:id`, async (request, reply) => {
    const record = await service.get(id(request));
    return record
      ? ok(record, { requestId: request.id })
      : reply.code(404).send(notFound(request.id));
  });
  app.post(ADDRESS_TYPES_COLLECTION_PATH, async (request) =>
    ok(await service.create(request.body as AddressTypesSavePayload), {
      requestId: request.id
    })
  );
  app.put(`/core/common/contacts/address-types/:id`, async (request) =>
    ok(await service.update(id(request), request.body as AddressTypesSavePayload), {
      requestId: request.id
    })
  );
  app.post(`/core/common/contacts/address-types/:id/activate`, async (request) =>
    ok(await service.setActive(id(request), true), { requestId: request.id })
  );
  app.post(`/core/common/contacts/address-types/:id/deactivate`, async (request) =>
    ok(await service.setActive(id(request), false), { requestId: request.id })
  );
  app.delete(`/core/common/contacts/address-types/:id/force`, async (request) =>
    ok(await service.forceDelete(id(request)), { requestId: request.id })
  );
}

function id(request: FastifyRequest) {
  return (request.params as { id: string }).id;
}
function filters(request: FastifyRequest): AddressTypesListFilters {
  const search = (request.query as { search?: string } | undefined)?.search;
  return search ? { search } : {};
}
function notFound(requestId: string) {
  return {
    error: { code: "ADDRESS_TYPES_NOT_FOUND", message: "Address Types record was not found." },
    meta: { requestId, timestamp: new Date().toISOString() },
    success: false as const
  };
}
