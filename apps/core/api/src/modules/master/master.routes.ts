import type { FastifyInstance } from "fastify";
import { ok } from "@codexsun/framework/http";
import { masterDefinitions } from "./master.registry.js";
import { MasterService } from "./master.service.js";
import { resolveMasterTenantId } from "./master.context.js";
import type { MasterSaveInput } from "./foundation/master.types.js";

export async function registerMasterRoutes(app: FastifyInstance) {
  for (const definition of masterDefinitions) {
    const service = new MasterService(definition);
    app.get(`/core/master/${definition.route}`, async (request) => {
      const query = request.query as { search?: string };
      return ok(await service.list(resolveMasterTenantId(request), query.search ?? ""), { requestId: request.id });
    });
    app.get(`/core/master/${definition.route}/:id`, async (request, reply) => {
      const { id } = request.params as { id: string };
      const record = await service.find(resolveMasterTenantId(request), id);
      if (!record) return reply.status(404).send({ error: { message: `${definition.title} not found.` }, success: false });
      return ok(record, { requestId: request.id });
    });
    app.post(`/core/master/${definition.route}`, async (request) => ok(await service.create(resolveMasterTenantId(request), request.body as MasterSaveInput), { requestId: request.id }));
    app.put(`/core/master/${definition.route}/:id`, async (request, reply) => {
      const { id } = request.params as { id: string };
      const record = await service.update(resolveMasterTenantId(request), id, request.body as MasterSaveInput);
      if (!record) return reply.status(404).send({ error: { message: `${definition.title} not found.` }, success: false });
      return ok(record, { requestId: request.id });
    });
    app.post(`/core/master/${definition.route}/:id/:action`, async (request, reply) => {
      const { action, id } = request.params as { action: string; id: string };
      const record = await service.setActive(resolveMasterTenantId(request), id, action === "activate");
      if (!record) return reply.status(404).send({ error: { message: `${definition.title} not found or protected.` }, success: false });
      return ok(record, { requestId: request.id });
    });
    app.delete(`/core/master/${definition.route}/:id/force`, async (request, reply) => {
      const { id } = request.params as { id: string };
      const record = await service.forceDelete(resolveMasterTenantId(request), id);
      if (!record) return reply.status(404).send({ error: { message: `${definition.title} not found or protected.` }, success: false });
      return ok(record, { requestId: request.id });
    });
  }
}
