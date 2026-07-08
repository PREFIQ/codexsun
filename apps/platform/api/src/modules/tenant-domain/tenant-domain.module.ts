import type { FastifyInstance } from "fastify";
import { registerTenantDomainRoutes } from "./tenant-domain.routes.js";

export const tenantDomainModule = {
  key: "platform.tenant-domain",
  label: "Tenant Domain",
  async register(app: FastifyInstance) {
    await registerTenantDomainRoutes(app);
  }
};
