import type { FastifyInstance } from "fastify";
import { registerCountryRoutes } from "./country.routes.js";

export const countryModule = {
  key: "core.country",
  label: "Country",
  register(app: FastifyInstance) {
    return registerCountryRoutes(app);
  }
};
