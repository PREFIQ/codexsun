import type { FastifyInstance } from "fastify";
import { registerOrganisationRoutes } from "./organisation.routes.js";

export const organisationModule = {
  key: "core.organisation",
  label: "Organisation",
  register(app: FastifyInstance) {
    return registerOrganisationRoutes(app);
  }
};
