import type { FastifyInstance, FastifyRequest } from "fastify";
import { ok } from "@codexsun/framework/http";
import { ContactGroupsService } from "./contact-groups.service.js";
import type { ContactGroupsListFilters, ContactGroupsSavePayload } from "./contact-groups.types.js";

export const CONTACT_GROUPS_COLLECTION_PATH = "/core/common/contacts/contact-groups";
const service = new ContactGroupsService();

export async function registerContactGroupsRoutes(app: FastifyInstance) {
  app.get(CONTACT_GROUPS_COLLECTION_PATH, async (request) =>
    ok(await service.list(filters(request)), { requestId: request.id })
  );
  app.get(`/core/common/contacts/contact-groups/:id`, async (request, reply) => {
    const record = await service.get(id(request));
    return record
      ? ok(record, { requestId: request.id })
      : reply.code(404).send(notFound(request.id));
  });
  app.post(CONTACT_GROUPS_COLLECTION_PATH, async (request) =>
    ok(await service.create(request.body as ContactGroupsSavePayload), {
      requestId: request.id
    })
  );
  app.put(`/core/common/contacts/contact-groups/:id`, async (request) =>
    ok(await service.update(id(request), request.body as ContactGroupsSavePayload), {
      requestId: request.id
    })
  );
  app.post(`/core/common/contacts/contact-groups/:id/activate`, async (request) =>
    ok(await service.setActive(id(request), true), { requestId: request.id })
  );
  app.post(`/core/common/contacts/contact-groups/:id/deactivate`, async (request) =>
    ok(await service.setActive(id(request), false), { requestId: request.id })
  );
  app.delete(`/core/common/contacts/contact-groups/:id/force`, async (request) =>
    ok(await service.forceDelete(id(request)), { requestId: request.id })
  );
}

function id(request: FastifyRequest) {
  return (request.params as { id: string }).id;
}
function filters(request: FastifyRequest): ContactGroupsListFilters {
  const search = (request.query as { search?: string } | undefined)?.search;
  return search ? { search } : {};
}
function notFound(requestId: string) {
  return {
    error: { code: "CONTACT_GROUPS_NOT_FOUND", message: "Contact Groups record was not found." },
    meta: { requestId, timestamp: new Date().toISOString() },
    success: false as const
  };
}
