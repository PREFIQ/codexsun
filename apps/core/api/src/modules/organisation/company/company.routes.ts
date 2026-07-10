import type { FastifyInstance } from "fastify";
import { ok } from "@codexsun/framework/http";
import { resolveMasterTenantId } from "../../master/master.context.js";
import type { MasterSaveInput } from "../../master/foundation/master.types.js";
import { CompanyService } from "./company.service.js";

const companyPaths = ["/core/organisation/companies", "/core/master/companies"] as const;

export async function registerCompanyRoutes(app: FastifyInstance) {
  const service = new CompanyService();
  for (const path of companyPaths) {
    app.get(path, async (request) => {
      const query = request.query as { search?: string };
      return ok(await service.list(resolveMasterTenantId(request), query.search ?? ""), { requestId: request.id });
    });
    app.get(`${path}/:id`, async (request, reply) => {
      const { id } = request.params as { id: string };
      const record = await service.find(resolveMasterTenantId(request), id);
      if (!record) return reply.status(404).send({ error: { message: "Company not found." }, success: false });
      return ok(record, { requestId: request.id });
    });
    app.post(path, async (request) => ok(await service.create(resolveMasterTenantId(request), request.body as MasterSaveInput), { requestId: request.id }));
    app.put(`${path}/:id`, async (request, reply) => {
      const { id } = request.params as { id: string };
      const record = await service.update(resolveMasterTenantId(request), id, request.body as MasterSaveInput);
      if (!record) return reply.status(404).send({ error: { message: "Company not found." }, success: false });
      return ok(record, { requestId: request.id });
    });
  }
}
