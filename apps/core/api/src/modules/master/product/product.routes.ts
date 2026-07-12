import { ok } from "@codexsun/framework/http";
import type { FastifyInstance } from "fastify";
import { ProductService } from "./product.service.js";
import type { ProductSaveInput } from "./product.types.js";
export async function registerProductRoutes(app: FastifyInstance) {
  const service = new ProductService();
  const path = "/core/master/products";
  app.get(path, async (request) =>
    ok(await service.list(request.query as { search?: string }), { requestId: request.id })
  );
  app.get(`${path}/:id`, async (request, reply) => {
    const { id } = request.params as { id: string };
    const record = await service.find(id);
    return record
      ? ok(record, { requestId: request.id })
      : reply.status(404).send({ error: { message: "Product not found." }, success: false });
  });
  app.post(path, async (request) =>
    ok(await service.create(request.body as ProductSaveInput), { requestId: request.id })
  );
  app.put(`${path}/:id`, async (request, reply) => {
    const { id } = request.params as { id: string };
    const record = await service.update(id, request.body as ProductSaveInput);
    return record
      ? ok(record, { requestId: request.id })
      : reply.status(404).send({ error: { message: "Product not found." }, success: false });
  });
  app.post(`${path}/:id/:action`, async (request, reply) => {
    const { id, action } = request.params as { id: string; action: string };
    const record = await service.setActive(id, action === "activate");
    return record
      ? ok(record, { requestId: request.id })
      : reply
          .status(404)
          .send({ error: { message: "Product not found or protected." }, success: false });
  });
  app.delete(`${path}/:id/force`, async (request, reply) => {
    const { id } = request.params as { id: string };
    const record = await service.forceDelete(id);
    return record
      ? ok(record, { requestId: request.id })
      : reply
          .status(404)
          .send({ error: { message: "Product not found or protected." }, success: false });
  });
}
