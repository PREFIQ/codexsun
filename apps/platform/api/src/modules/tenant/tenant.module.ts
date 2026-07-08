import type { FastifyInstance } from "fastify";
import { registerTenantRoutes } from "./tenant.routes.js";

export const tenantModule = {
  key: "platform.tenant",
  label: "Tenant",
  async register(app: FastifyInstance) {
    await registerTenantRoutes(app);
  }
};
