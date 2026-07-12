import type { FastifyInstance, FastifyRequest } from "fastify";
import { ok } from "@codexsun/framework/http";
import { BankNamesService } from "./bank-names.service.js";
import type { BankNamesListFilters, BankNamesSavePayload } from "./bank-names.types.js";

export const BANK_NAMES_COLLECTION_PATH = "/core/common/contacts/bank-names";
const service = new BankNamesService();

export async function registerBankNamesRoutes(app: FastifyInstance) {
  app.get(BANK_NAMES_COLLECTION_PATH, async (request) =>
    ok(await service.list(filters(request)), { requestId: request.id })
  );
  app.get(`/core/common/contacts/bank-names/:id`, async (request, reply) => {
    const record = await service.get(id(request));
    return record
      ? ok(record, { requestId: request.id })
      : reply.code(404).send(notFound(request.id));
  });
  app.post(BANK_NAMES_COLLECTION_PATH, async (request) =>
    ok(await service.create(request.body as BankNamesSavePayload), {
      requestId: request.id
    })
  );
  app.put(`/core/common/contacts/bank-names/:id`, async (request) =>
    ok(await service.update(id(request), request.body as BankNamesSavePayload), {
      requestId: request.id
    })
  );
  app.post(`/core/common/contacts/bank-names/:id/activate`, async (request) =>
    ok(await service.setActive(id(request), true), { requestId: request.id })
  );
  app.post(`/core/common/contacts/bank-names/:id/deactivate`, async (request) =>
    ok(await service.setActive(id(request), false), { requestId: request.id })
  );
  app.delete(`/core/common/contacts/bank-names/:id/force`, async (request) =>
    ok(await service.forceDelete(id(request)), { requestId: request.id })
  );
}

function id(request: FastifyRequest) {
  return (request.params as { id: string }).id;
}
function filters(request: FastifyRequest): BankNamesListFilters {
  const search = (request.query as { search?: string } | undefined)?.search;
  return search ? { search } : {};
}
function notFound(requestId: string) {
  return {
    error: { code: "BANK_NAMES_NOT_FOUND", message: "Bank Names record was not found." },
    meta: { requestId, timestamp: new Date().toISOString() },
    success: false as const
  };
}
