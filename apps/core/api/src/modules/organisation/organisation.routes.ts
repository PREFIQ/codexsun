import type { FastifyInstance } from "fastify";
import { registerCompanyRoutes } from "./company/company.routes.js";

export async function registerOrganisationRoutes(app: FastifyInstance) {
  await registerCompanyRoutes(app);
}
