import type { FastifyInstance } from "fastify";
import { companyModule } from "./company/index.js";

export const organisationModule = {
  key: "core.organisation",
  label: "Organisation",
  register(app: FastifyInstance) {
    return companyModule.register(app);
  }
};
