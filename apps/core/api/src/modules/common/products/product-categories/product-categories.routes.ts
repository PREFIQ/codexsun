import type { FastifyInstance, FastifyRequest } from "fastify";
import { ok } from "@codexsun/framework/http";
import { ProductCategoriesService } from "./product-categories.service.js";
import type {
  ProductCategoriesListFilters,
  ProductCategoriesSavePayload
} from "./product-categories.types.js";

export const PRODUCT_CATEGORIES_COLLECTION_PATH = "/core/common/products/product-categories";
const service = new ProductCategoriesService();

export async function registerProductCategoriesRoutes(app: FastifyInstance) {
  app.get(PRODUCT_CATEGORIES_COLLECTION_PATH, async (request) =>
    ok(await service.list(filters(request)), { requestId: request.id })
  );
  app.get(`/core/common/products/product-categories/:id`, async (request, reply) => {
    const record = await service.get(id(request));
    return record
      ? ok(record, { requestId: request.id })
      : reply.code(404).send(notFound(request.id));
  });
  app.post(PRODUCT_CATEGORIES_COLLECTION_PATH, async (request) =>
    ok(await service.create(request.body as ProductCategoriesSavePayload), {
      requestId: request.id
    })
  );
  app.put(`/core/common/products/product-categories/:id`, async (request) =>
    ok(await service.update(id(request), request.body as ProductCategoriesSavePayload), {
      requestId: request.id
    })
  );
  app.post(`/core/common/products/product-categories/:id/activate`, async (request) =>
    ok(await service.setActive(id(request), true), { requestId: request.id })
  );
  app.post(`/core/common/products/product-categories/:id/deactivate`, async (request) =>
    ok(await service.setActive(id(request), false), { requestId: request.id })
  );
  app.delete(`/core/common/products/product-categories/:id/force`, async (request) =>
    ok(await service.forceDelete(id(request)), { requestId: request.id })
  );
}

function id(request: FastifyRequest) {
  return (request.params as { id: string }).id;
}
function filters(request: FastifyRequest): ProductCategoriesListFilters {
  const search = (request.query as { search?: string } | undefined)?.search;
  return search ? { search } : {};
}
function notFound(requestId: string) {
  return {
    error: {
      code: "PRODUCT_CATEGORIES_NOT_FOUND",
      message: "Product Categories record was not found."
    },
    meta: { requestId, timestamp: new Date().toISOString() },
    success: false as const
  };
}
