import type { FastifyInstance } from "fastify";
import { ok } from "@codexsun/framework/http";
import { countryLocationDefinition } from "../location.definitions.js";
import { createLocationRoutes } from "../shared/location.routes.js";
import { resolveLocationTenantId } from "../shared/location.context.js";
import { CountryService } from "./country.service.js";

const registerSharedCountryRoutes = createLocationRoutes(countryLocationDefinition);
const countryService = new CountryService();

export async function registerCountryRoutes(app: FastifyInstance) {
  await registerSharedCountryRoutes(app);

  app.get("/core/countries", async (request) => {
    const tenantId = resolveLocationTenantId(request);
    return ok(await countryService.list(tenantId), { requestId: request.id, tenantId });
  });
}

