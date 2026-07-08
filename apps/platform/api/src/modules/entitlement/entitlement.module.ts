import type { FastifyInstance } from "fastify";
import { registerEntitlementRoutes } from "./entitlement.routes.js";

export const entitlementModule = {
  key: "platform.entitlement",
  label: "Entitlements",
  register(app: FastifyInstance) {
    return registerEntitlementRoutes(app);
  }
};
