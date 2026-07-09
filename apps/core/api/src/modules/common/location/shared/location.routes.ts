import type { FastifyInstance, FastifyRequest } from "fastify";
import { ok } from "@codexsun/framework/http";
import { resolveLocationTenantId } from "./location.context.js";
import { LocationService } from "./location.service.js";
import type { LocationDefinition, LocationListFilters, LocationSavePayload } from "./location.types.js";

export function createLocationRoutes(definition: LocationDefinition) {
  const service = new LocationService(definition);

  function notFound(requestId: string) {
    return {
      error: {
        code: definition.notFoundCode,
        message: definition.notFoundMessage
      },
      meta: {
        requestId,
        timestamp: new Date().toISOString()
      },
      success: false as const
    };
  }

  return async function registerLocationRoutes(app: FastifyInstance) {
    app.get(definition.collectionPath, async (request) => {
      const tenantId = resolveLocationTenantId(request);
      return ok(await service.list(tenantId, filtersFromRequest(request)), { requestId: request.id, tenantId });
    });

    app.get(`${definition.collectionPath}/:id`, async (request, reply) => {
      const tenantId = resolveLocationTenantId(request);
      const { id } = request.params as { id: string };
      const record = await service.get(tenantId, id);
      if (!record) return reply.code(404).send(notFound(request.id));
      return ok(record, { requestId: request.id, tenantId });
    });

    app.post(definition.collectionPath, async (request) => {
      const tenantId = resolveLocationTenantId(request);
      return ok(await service.create(tenantId, request.body as LocationSavePayload), { requestId: request.id, tenantId });
    });

    app.put(`${definition.collectionPath}/:id`, async (request, reply) => {
      const tenantId = resolveLocationTenantId(request);
      const { id } = request.params as { id: string };
      const record = await service.update(tenantId, id, request.body as LocationSavePayload);
      if (!record) return reply.code(404).send(notFound(request.id));
      return ok(record, { requestId: request.id, tenantId });
    });

    app.post(`${definition.collectionPath}/:id/activate`, async (request, reply) => {
      const tenantId = resolveLocationTenantId(request);
      const { id } = request.params as { id: string };
      const record = await service.activate(tenantId, id);
      if (!record) return reply.code(404).send(notFound(request.id));
      return ok(record, { requestId: request.id, tenantId });
    });

    app.post(`${definition.collectionPath}/:id/deactivate`, async (request, reply) => {
      const tenantId = resolveLocationTenantId(request);
      const { id } = request.params as { id: string };
      const record = await service.deactivate(tenantId, id);
      if (!record) return reply.code(404).send(notFound(request.id));
      return ok(record, { requestId: request.id, tenantId });
    });

    app.delete(`${definition.collectionPath}/:id/force`, async (request, reply) => {
      const tenantId = resolveLocationTenantId(request);
      const { id } = request.params as { id: string };
      const record = await service.forceDelete(tenantId, id);
      if (!record) return reply.code(404).send(notFound(request.id));
      return ok(record, { requestId: request.id, tenantId });
    });
  };
}

function filtersFromRequest(request: FastifyRequest): LocationListFilters {
  const query = request.query as LocationListFilters | undefined;
  const filters: LocationListFilters = {};
  if (query?.cityId) filters.cityId = query.cityId;
  if (query?.countryId) filters.countryId = query.countryId;
  if (query?.districtId) filters.districtId = query.districtId;
  if (query?.search) filters.search = query.search;
  if (query?.stateId) filters.stateId = query.stateId;
  return filters;
}
