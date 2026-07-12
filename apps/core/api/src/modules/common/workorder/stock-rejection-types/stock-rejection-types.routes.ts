import type { FastifyInstance, FastifyRequest } from "fastify";
import { ok } from "@codexsun/framework/http";
import { StockRejectionTypesService } from "./stock-rejection-types.service.js";
import type {
  StockRejectionTypesListFilters,
  StockRejectionTypesSavePayload
} from "./stock-rejection-types.types.js";

export const STOCK_REJECTION_TYPES_COLLECTION_PATH = "/core/common/workorder/stock-rejection-types";
const service = new StockRejectionTypesService();

export async function registerStockRejectionTypesRoutes(app: FastifyInstance) {
  app.get(STOCK_REJECTION_TYPES_COLLECTION_PATH, async (request) =>
    ok(await service.list(filters(request)), { requestId: request.id })
  );
  app.get(`/core/common/workorder/stock-rejection-types/:id`, async (request, reply) => {
    const record = await service.get(id(request));
    return record
      ? ok(record, { requestId: request.id })
      : reply.code(404).send(notFound(request.id));
  });
  app.post(STOCK_REJECTION_TYPES_COLLECTION_PATH, async (request) =>
    ok(await service.create(request.body as StockRejectionTypesSavePayload), {
      requestId: request.id
    })
  );
  app.put(`/core/common/workorder/stock-rejection-types/:id`, async (request) =>
    ok(await service.update(id(request), request.body as StockRejectionTypesSavePayload), {
      requestId: request.id
    })
  );
  app.post(`/core/common/workorder/stock-rejection-types/:id/activate`, async (request) =>
    ok(await service.setActive(id(request), true), { requestId: request.id })
  );
  app.post(`/core/common/workorder/stock-rejection-types/:id/deactivate`, async (request) =>
    ok(await service.setActive(id(request), false), { requestId: request.id })
  );
  app.delete(`/core/common/workorder/stock-rejection-types/:id/force`, async (request) =>
    ok(await service.forceDelete(id(request)), { requestId: request.id })
  );
}

function id(request: FastifyRequest) {
  return (request.params as { id: string }).id;
}
function filters(request: FastifyRequest): StockRejectionTypesListFilters {
  const search = (request.query as { search?: string } | undefined)?.search;
  return search ? { search } : {};
}
function notFound(requestId: string) {
  return {
    error: {
      code: "STOCK_REJECTION_TYPES_NOT_FOUND",
      message: "Stock Rejection Types record was not found."
    },
    meta: { requestId, timestamp: new Date().toISOString() },
    success: false as const
  };
}
