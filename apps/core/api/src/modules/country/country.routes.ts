import type { FastifyInstance } from "fastify";
import { ok } from "@codexsun/framework/http";
import { CountryService } from "./country.service.js";
import type { CountrySavePayload } from "./country.types.js";

const countryService = new CountryService();

function notFound(requestId: string) {
  return {
    error: {
      code: "COUNTRY_NOT_FOUND",
      message: "Country was not found."
    },
    meta: {
      requestId,
      timestamp: new Date().toISOString()
    },
    success: false as const
  };
}

export async function registerCountryRoutes(app: FastifyInstance) {
  app.get("/core/countries", async (request) => ok(await countryService.listCountries(), { requestId: request.id }));

  app.post("/core/countries", async (request) =>
    ok(await countryService.createCountry(request.body as CountrySavePayload), { requestId: request.id })
  );

  app.put("/core/countries/:id", async (request, reply) => {
    const { id } = request.params as { id: string };
    const country = await countryService.updateCountry(id, request.body as CountrySavePayload);
    if (!country) return reply.code(404).send(notFound(request.id));
    return ok(country, { requestId: request.id });
  });

  app.post("/core/countries/:id/activate", async (request, reply) => {
    const { id } = request.params as { id: string };
    const country = await countryService.activateCountry(id);
    if (!country) return reply.code(404).send(notFound(request.id));
    return ok(country, { requestId: request.id });
  });

  app.post("/core/countries/:id/deactivate", async (request, reply) => {
    const { id } = request.params as { id: string };
    const country = await countryService.deactivateCountry(id);
    if (!country) return reply.code(404).send(notFound(request.id));
    return ok(country, { requestId: request.id });
  });
}
