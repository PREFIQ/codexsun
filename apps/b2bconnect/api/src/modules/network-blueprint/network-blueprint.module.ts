import type { FastifyInstance } from "fastify";
import { registerNetworkBlueprintRoutes } from "./network-blueprint.routes.js";
import { NetworkBlueprintService } from "./network-blueprint.service.js";

export function createNetworkBlueprintModule() {
  const service = new NetworkBlueprintService();
  return {
    capabilityExemptions: [
      "crud",
      "persistence",
      "migration",
      "seed",
      "events",
      "worker",
      "sync"
    ] as const,
    key: "b2bconnect.network-blueprint",
    register(app: FastifyInstance) {
      registerNetworkBlueprintRoutes(app, service);
    }
  };
}
