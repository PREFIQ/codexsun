import type { FastifyInstance, FastifyRequest } from "fastify";
import { ok } from "@codexsun/framework/http";
import { WorkOrderTypesService } from "./work-order-types.service.js";
import type {
  WorkOrderTypesListFilters,
  WorkOrderTypesSavePayload
} from "./work-order-types.types.js";

export const WORK_ORDER_TYPES_COLLECTION_PATH = "/core/common/workorder/work-order-types";
const service = new WorkOrderTypesService();

export async function registerWorkOrderTypesRoutes(app: FastifyInstance) {
  app.get(WORK_ORDER_TYPES_COLLECTION_PATH, async (request) =>
    ok(await service.list(filters(request)), { requestId: request.id })
  );
  app.get(`/core/common/workorder/work-order-types/:id`, async (request, reply) => {
    const record = await service.get(id(request));
    return record
      ? ok(record, { requestId: request.id })
      : reply.code(404).send(notFound(request.id));
  });
  app.post(WORK_ORDER_TYPES_COLLECTION_PATH, async (request) =>
    ok(await service.create(request.body as WorkOrderTypesSavePayload), {
      requestId: request.id
    })
  );
  app.put(`/core/common/workorder/work-order-types/:id`, async (request) =>
    ok(await service.update(id(request), request.body as WorkOrderTypesSavePayload), {
      requestId: request.id
    })
  );
  app.post(`/core/common/workorder/work-order-types/:id/activate`, async (request) =>
    ok(await service.setActive(id(request), true), { requestId: request.id })
  );
  app.post(`/core/common/workorder/work-order-types/:id/deactivate`, async (request) =>
    ok(await service.setActive(id(request), false), { requestId: request.id })
  );
  app.delete(`/core/common/workorder/work-order-types/:id/force`, async (request) =>
    ok(await service.forceDelete(id(request)), { requestId: request.id })
  );
}

function id(request: FastifyRequest) {
  return (request.params as { id: string }).id;
}
function filters(request: FastifyRequest): WorkOrderTypesListFilters {
  const search = (request.query as { search?: string } | undefined)?.search;
  return search ? { search } : {};
}
function notFound(requestId: string) {
  return {
    error: {
      code: "WORK_ORDER_TYPES_NOT_FOUND",
      message: "Work Order Types record was not found."
    },
    meta: { requestId, timestamp: new Date().toISOString() },
    success: false as const
  };
}
