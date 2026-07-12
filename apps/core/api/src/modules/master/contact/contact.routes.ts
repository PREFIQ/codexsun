import { ok } from "@codexsun/framework/http";
import type { FastifyInstance } from "fastify";
import { ContactService } from "./contact.service.js";
import type { ContactSaveInput } from "./contact.types.js";
export async function registerContactRoutes(app: FastifyInstance) {
  const service = new ContactService();
  const path = "/core/master/contacts";
  app.get(path, async (request) =>
    ok(await service.list(request.query as { search?: string }), {
      requestId: request.id
    })
  );
  app.get(`${path}/:id`, async (request, reply) => {
    const { id } = request.params as { id: string };
    const record = await service.find(id);
    return record
      ? ok(record, { requestId: request.id })
      : reply.status(404).send({ error: { message: "Contact not found." }, success: false });
  });
  app.post(path, async (request) =>
    ok(await service.create(request.body as ContactSaveInput), {
      requestId: request.id
    })
  );
  app.put(`${path}/:id`, async (request, reply) => {
    const { id } = request.params as { id: string };
    const record = await service.update(id, request.body as ContactSaveInput);
    return record
      ? ok(record, { requestId: request.id })
      : reply.status(404).send({ error: { message: "Contact not found." }, success: false });
  });
  app.post(`${path}/:id/:action`, async (request, reply) => {
    const { id, action } = request.params as { id: string; action: string };
    const record = await service.setActive(id, action === "activate");
    return record
      ? ok(record, { requestId: request.id })
      : reply
          .status(404)
          .send({ error: { message: "Contact not found or protected." }, success: false });
  });
  app.delete(`${path}/:id/force`, async (request, reply) => {
    const { id } = request.params as { id: string };
    const record = await service.forceDelete(id);
    return record
      ? ok(record, { requestId: request.id })
      : reply
          .status(404)
          .send({ error: { message: "Contact not found or protected." }, success: false });
  });
}
