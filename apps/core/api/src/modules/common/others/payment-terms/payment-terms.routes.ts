import type { FastifyInstance, FastifyRequest } from "fastify";
import { ok } from "@codexsun/framework/http";
import { PaymentTermsService } from "./payment-terms.service.js";
import type { PaymentTermsListFilters, PaymentTermsSavePayload } from "./payment-terms.types.js";

export const PAYMENT_TERMS_COLLECTION_PATH = "/core/common/others/payment-terms";
const service = new PaymentTermsService();

export async function registerPaymentTermsRoutes(app: FastifyInstance) {
  app.get(PAYMENT_TERMS_COLLECTION_PATH, async (request) =>
    ok(await service.list(filters(request)), { requestId: request.id })
  );
  app.get(`/core/common/others/payment-terms/:id`, async (request, reply) => {
    const record = await service.get(id(request));
    return record
      ? ok(record, { requestId: request.id })
      : reply.code(404).send(notFound(request.id));
  });
  app.post(PAYMENT_TERMS_COLLECTION_PATH, async (request) =>
    ok(await service.create(request.body as PaymentTermsSavePayload), {
      requestId: request.id
    })
  );
  app.put(`/core/common/others/payment-terms/:id`, async (request) =>
    ok(await service.update(id(request), request.body as PaymentTermsSavePayload), {
      requestId: request.id
    })
  );
  app.post(`/core/common/others/payment-terms/:id/activate`, async (request) =>
    ok(await service.setActive(id(request), true), { requestId: request.id })
  );
  app.post(`/core/common/others/payment-terms/:id/deactivate`, async (request) =>
    ok(await service.setActive(id(request), false), { requestId: request.id })
  );
  app.delete(`/core/common/others/payment-terms/:id/force`, async (request) =>
    ok(await service.forceDelete(id(request)), { requestId: request.id })
  );
}

function id(request: FastifyRequest) {
  return (request.params as { id: string }).id;
}
function filters(request: FastifyRequest): PaymentTermsListFilters {
  const search = (request.query as { search?: string } | undefined)?.search;
  return search ? { search } : {};
}
function notFound(requestId: string) {
  return {
    error: { code: "PAYMENT_TERMS_NOT_FOUND", message: "Payment Terms record was not found." },
    meta: { requestId, timestamp: new Date().toISOString() },
    success: false as const
  };
}
