import type { FastifyInstance, FastifyRequest } from "fastify";
import { ok } from "@codexsun/framework/http";
import { ContactTypesService } from "./contact-types.service.js";
import type { ContactTypesListFilters, ContactTypesSavePayload } from "./contact-types.types.js";

export const CONTACT_TYPES_COLLECTION_PATH = "/core/common/contacts/contact-types";
const service = new ContactTypesService();

export async function registerContactTypesRoutes(app: FastifyInstance) {
  app.get(CONTACT_TYPES_COLLECTION_PATH, async (request) =>
    ok(await service.list(filters(request)), { requestId: request.id })
  );
  app.get(`/core/common/contacts/contact-types/:id`, async (request, reply) => {
    const record = await service.get(id(request));
    return record
      ? ok(record, { requestId: request.id })
      : reply.code(404).send(notFound(request.id));
  });
  app.post(CONTACT_TYPES_COLLECTION_PATH, async (request) =>
    ok(await service.create(request.body as ContactTypesSavePayload), {
      requestId: request.id
    })
  );
  app.put(`/core/common/contacts/contact-types/:id`, async (request) =>
    ok(await service.update(id(request), request.body as ContactTypesSavePayload), {
      requestId: request.id
    })
  );
  app.post(`/core/common/contacts/contact-types/:id/activate`, async (request) =>
    ok(await service.setActive(id(request), true), { requestId: request.id })
  );
  app.post(`/core/common/contacts/contact-types/:id/deactivate`, async (request) =>
    ok(await service.setActive(id(request), false), { requestId: request.id })
  );
  app.delete(`/core/common/contacts/contact-types/:id/force`, async (request) =>
    ok(await service.forceDelete(id(request)), { requestId: request.id })
  );
}

function id(request: FastifyRequest) {
  return (request.params as { id: string }).id;
}
function filters(request: FastifyRequest): ContactTypesListFilters {
  const search = (request.query as { search?: string } | undefined)?.search;
  return search ? { search } : {};
}
function notFound(requestId: string) {
  return {
    error: { code: "CONTACT_TYPES_NOT_FOUND", message: "Contact Types record was not found." },
    meta: { requestId, timestamp: new Date().toISOString() },
    success: false as const
  };
}
