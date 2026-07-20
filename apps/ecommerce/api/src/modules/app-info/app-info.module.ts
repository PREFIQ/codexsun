import type { FastifyInstance } from "fastify";
import { registerEcommerceAppInfoRoutes } from "./app-info.routes.js";
import type { EcommerceAppInfo, EcommerceAppInfoConfig } from "./app-info.types.js";

export function createEcommerceAppInfoModule(config: EcommerceAppInfoConfig) {
  const appInfo: EcommerceAppInfo = {
    appId: "ecommerce",
    brandName: config.brandName,
    businessModel: "multi-vendor-ecommerce",
    moduleBoundary: {
      current: ["app-info"],
      planned: ["vendors", "catalog", "cart", "orders", "fulfilment"]
    },
    purpose: config.purpose,
    stack: {
      foundation: ["framework", "platform", "core", "billing"],
      owner: "ecommerce"
    },
    status: "scaffold",
    tagline: config.tagline
  };

  return {
    capabilityExemptions: [
      "persistence",
      "business-service",
      "migration",
      "seed",
      "events",
      "worker",
      "sync"
    ] as const,
    key: "ecommerce.app-info",
    label: `${config.brandName} App Information`,
    scope: "public",
    register(app: FastifyInstance) {
      return registerEcommerceAppInfoRoutes(app, appInfo);
    }
  };
}
