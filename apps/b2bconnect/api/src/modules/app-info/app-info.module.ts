import type { FastifyInstance } from "fastify";
import { registerB2bConnectAppInfoRoutes } from "./app-info.routes.js";
import type { B2bConnectAppInfo, B2bConnectAppInfoConfig } from "./app-info.types.js";

export function createB2bConnectAppInfoModule(config: B2bConnectAppInfoConfig) {
  const appInfo: B2bConnectAppInfo = {
    appId: "b2bconnect",
    brandName: config.brandName,
    businessModel: "b2b-marketplace",
    moduleBoundary: {
      current: [
        "app-info",
        "authentication",
        "business-profile",
        "client-portal",
        "network-blueprint",
        "administration",
        "super-administration"
      ],
      planned: [
        "leads",
        "rfq",
        "capacity-exchange",
        "networking",
        "jobs",
        "events",
        "finance",
        "export-intelligence"
      ]
    },
    purpose: config.purpose,
    stack: {
      foundation: ["framework", "platform", "core"],
      owner: "b2bconnect"
    },
    status: "foundation",
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
    key: "b2bconnect.app-info",
    label: `${config.brandName} App Information`,
    scope: "public",
    register(app: FastifyInstance) {
      return registerB2bConnectAppInfoRoutes(app, appInfo);
    }
  };
}
