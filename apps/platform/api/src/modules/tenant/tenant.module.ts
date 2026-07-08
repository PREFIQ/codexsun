import type { FastifyInstance } from "fastify";
import { registerTenantRoutes } from "./tenant.routes.js";

export const tenantModule = {
  key: "platform.tenant",
  label: "Tenant",
  register(app: FastifyInstance) {
    return registerTenantRoutes(app);
  }
};
