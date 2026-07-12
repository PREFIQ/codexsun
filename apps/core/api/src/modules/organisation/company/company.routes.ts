import type { FastifyInstance } from "fastify";
import { ok } from "@codexsun/framework/http";
import type { CompanySaveInput } from "./company.types.js";
import { CompanyService } from "./company.service.js";

const companyPaths = ["/core/organisation/companies", "/core/master/companies"] as const;

export async function registerCompanyRoutes(app: FastifyInstance) {
  const service = new CompanyService();
  app.get("/core/organisation/industries", async (request) =>
    ok(await service.listIndustries(), { requestId: request.id })
  );
  for (const path of companyPaths) {
    app.get(path, async (request) => {
      const query = request.query as { search?: string };
      return ok(await service.list(query.search ?? ""), {
        requestId: request.id
      });
    });
    app.get(`${path}/:id`, async (request, reply) => {
      const { id } = request.params as { id: string };
      const record = await service.find(id);
      if (!record)
        return reply.status(404).send({ error: { message: "Company not found." }, success: false });
      return ok(record, { requestId: request.id });
    });
    app.post(path, async (request) =>
      ok(await service.create(request.body as CompanySaveInput), {
        requestId: request.id
      })
    );
    app.put(`${path}/:id`, async (request, reply) => {
      const { id } = request.params as { id: string };
      const record = await service.update(id, request.body as CompanySaveInput);
      if (!record)
        return reply.status(404).send({ error: { message: "Company not found." }, success: false });
      return ok(record, { requestId: request.id });
    });
  }
}
