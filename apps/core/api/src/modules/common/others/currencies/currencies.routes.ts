import type { FastifyInstance, FastifyRequest } from "fastify";
import { ok } from "@codexsun/framework/http";
import { CurrenciesService } from "./currencies.service.js";
import type { CurrenciesListFilters, CurrenciesSavePayload } from "./currencies.types.js";

export const CURRENCIES_COLLECTION_PATH = "/core/common/others/currencies";
const service = new CurrenciesService();

export async function registerCurrenciesRoutes(app: FastifyInstance) {
  app.get(CURRENCIES_COLLECTION_PATH, async (request) =>
    ok(await service.list(filters(request)), { requestId: request.id })
  );
  app.get(`/core/common/others/currencies/:id`, async (request, reply) => {
    const record = await service.get(id(request));
    return record
      ? ok(record, { requestId: request.id })
      : reply.code(404).send(notFound(request.id));
  });
  app.post(CURRENCIES_COLLECTION_PATH, async (request) =>
    ok(await service.create(request.body as CurrenciesSavePayload), {
      requestId: request.id
    })
  );
  app.put(`/core/common/others/currencies/:id`, async (request) =>
    ok(await service.update(id(request), request.body as CurrenciesSavePayload), {
      requestId: request.id
    })
  );
  app.post(`/core/common/others/currencies/:id/activate`, async (request) =>
    ok(await service.setActive(id(request), true), { requestId: request.id })
  );
  app.post(`/core/common/others/currencies/:id/deactivate`, async (request) =>
    ok(await service.setActive(id(request), false), { requestId: request.id })
  );
  app.delete(`/core/common/others/currencies/:id/force`, async (request) =>
    ok(await service.forceDelete(id(request)), { requestId: request.id })
  );
}

function id(request: FastifyRequest) {
  return (request.params as { id: string }).id;
}
function filters(request: FastifyRequest): CurrenciesListFilters {
  const search = (request.query as { search?: string } | undefined)?.search;
  return search ? { search } : {};
}
function notFound(requestId: string) {
  return {
    error: { code: "CURRENCIES_NOT_FOUND", message: "Currencies record was not found." },
    meta: { requestId, timestamp: new Date().toISOString() },
    success: false as const
  };
}
