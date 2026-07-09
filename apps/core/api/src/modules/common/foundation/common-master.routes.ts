import type { FastifyInstance } from "fastify";
import { ok } from "@codexsun/framework/http";
import { resolveLocationTenantId } from "../location/shared/location.context.js";
import { CommonMasterService } from "./common-master.service.js";
import type { CommonMasterDefinition } from "./common-master.types.js";

export function createCommonMasterRoutes(definition: CommonMasterDefinition) {
  const service = new CommonMasterService(definition);
  return async function register(app: FastifyInstance) {
    app.get(definition.path, async (request) => ok(await service.list(resolveLocationTenantId(request)), { requestId: request.id }));
    app.get(`${definition.path}/:id`, async (request) => {
      const { id } = request.params as { id: string };
      return ok(await service.find(resolveLocationTenantId(request), id), { requestId: request.id });
    });
    app.post(definition.path, async (request) => ok(await service.create(resolveLocationTenantId(request), request.body as Record<string, unknown>), { requestId: request.id }));
    app.put(`${definition.path}/:id`, async (request) => {
      const { id } = request.params as { id: string };
      return ok(await service.update(resolveLocationTenantId(request), id, request.body as Record<string, unknown>), { requestId: request.id });
    });
    app.post(`${definition.path}/:id/activate`, async (request) => {
      const { id } = request.params as { id: string };
      return ok(await service.activate(resolveLocationTenantId(request), id), { requestId: request.id });
    });
    app.post(`${definition.path}/:id/deactivate`, async (request) => {
      const { id } = request.params as { id: string };
      return ok(await service.deactivate(resolveLocationTenantId(request), id), { requestId: request.id });
    });
  };
}
