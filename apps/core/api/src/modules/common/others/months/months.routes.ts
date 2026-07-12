import type { FastifyInstance, FastifyRequest } from "fastify";
import { ok } from "@codexsun/framework/http";
import { MonthsService } from "./months.service.js";
import type { MonthsListFilters, MonthsSavePayload } from "./months.types.js";

export const MONTHS_COLLECTION_PATH = "/core/common/others/months";
const service = new MonthsService();

export async function registerMonthsRoutes(app: FastifyInstance) {
  app.get(MONTHS_COLLECTION_PATH, async (request) =>
    ok(await service.list(filters(request)), { requestId: request.id })
  );
  app.get(`/core/common/others/months/:id`, async (request, reply) => {
    const record = await service.get(id(request));
    return record
      ? ok(record, { requestId: request.id })
      : reply.code(404).send(notFound(request.id));
  });
  app.post(MONTHS_COLLECTION_PATH, async (request) =>
    ok(await service.create(request.body as MonthsSavePayload), {
      requestId: request.id
    })
  );
  app.put(`/core/common/others/months/:id`, async (request) =>
    ok(await service.update(id(request), request.body as MonthsSavePayload), {
      requestId: request.id
    })
  );
  app.post(`/core/common/others/months/:id/activate`, async (request) =>
    ok(await service.setActive(id(request), true), { requestId: request.id })
  );
  app.post(`/core/common/others/months/:id/deactivate`, async (request) =>
    ok(await service.setActive(id(request), false), { requestId: request.id })
  );
  app.delete(`/core/common/others/months/:id/force`, async (request) =>
    ok(await service.forceDelete(id(request)), { requestId: request.id })
  );
}

function id(request: FastifyRequest) {
  return (request.params as { id: string }).id;
}
function filters(request: FastifyRequest): MonthsListFilters {
  const search = (request.query as { search?: string } | undefined)?.search;
  return search ? { search } : {};
}
function notFound(requestId: string) {
  return {
    error: { code: "MONTHS_NOT_FOUND", message: "Months record was not found." },
    meta: { requestId, timestamp: new Date().toISOString() },
    success: false as const
  };
}
