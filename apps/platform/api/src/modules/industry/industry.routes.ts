import type { FastifyInstance } from "fastify";
import { ok } from "@codexsun/framework/http";
import { IndustryService } from "./industry.service.js";
import type { IndustrySavePayload } from "./industry.types.js";
const service = new IndustryService();
export async function registerIndustryRoutes(app: FastifyInstance) {
  app.get("/admin/industries", async (r) =>
    ok(await service.listIndustries(), { requestId: r.id })
  );
  app.post("/admin/industries", async (r) =>
    ok(await service.createIndustry(r.body as IndustrySavePayload), { requestId: r.id })
  );
  app.put("/admin/industries/:id", async (r, reply) => {
    const industry = await service.updateIndustry(
      (r.params as { id: string }).id,
      r.body as IndustrySavePayload
    );
    if (!industry)
      return reply.code(404).send(notFound("INDUSTRY_NOT_FOUND", "Industry was not found.", r.id));
    return ok(industry, { requestId: r.id });
  });
}
function notFound(code: string, message: string, requestId: string) {
  return {
    error: { code, message },
    meta: { requestId, timestamp: new Date().toISOString() },
    success: false as const
  };
}
