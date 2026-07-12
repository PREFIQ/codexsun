import type { FastifyInstance, FastifyRequest } from "fastify";
import { ok } from "@codexsun/framework/http";
import { ProductGroupsService } from "./product-groups.service.js";
import type { ProductGroupsListFilters, ProductGroupsSavePayload } from "./product-groups.types.js";

export const PRODUCT_GROUPS_COLLECTION_PATH = "/core/common/products/product-groups";
const service = new ProductGroupsService();

export async function registerProductGroupsRoutes(app: FastifyInstance) {
  app.get(PRODUCT_GROUPS_COLLECTION_PATH, async (request) =>
    ok(await service.list(filters(request)), { requestId: request.id })
  );
  app.get(`/core/common/products/product-groups/:id`, async (request, reply) => {
    const record = await service.get(id(request));
    return record
      ? ok(record, { requestId: request.id })
      : reply.code(404).send(notFound(request.id));
  });
  app.post(PRODUCT_GROUPS_COLLECTION_PATH, async (request) =>
    ok(await service.create(request.body as ProductGroupsSavePayload), {
      requestId: request.id
    })
  );
  app.put(`/core/common/products/product-groups/:id`, async (request) =>
    ok(await service.update(id(request), request.body as ProductGroupsSavePayload), {
      requestId: request.id
    })
  );
  app.post(`/core/common/products/product-groups/:id/activate`, async (request) =>
    ok(await service.setActive(id(request), true), { requestId: request.id })
  );
  app.post(`/core/common/products/product-groups/:id/deactivate`, async (request) =>
    ok(await service.setActive(id(request), false), { requestId: request.id })
  );
  app.delete(`/core/common/products/product-groups/:id/force`, async (request) =>
    ok(await service.forceDelete(id(request)), { requestId: request.id })
  );
}

function id(request: FastifyRequest) {
  return (request.params as { id: string }).id;
}
function filters(request: FastifyRequest): ProductGroupsListFilters {
  const search = (request.query as { search?: string } | undefined)?.search;
  return search ? { search } : {};
}
function notFound(requestId: string) {
  return {
    error: { code: "PRODUCT_GROUPS_NOT_FOUND", message: "Product Groups record was not found." },
    meta: { requestId, timestamp: new Date().toISOString() },
    success: false as const
  };
}
