import type { FastifyInstance } from "fastify";
import { registerB2bConnectAuthenticationRoutes } from "./authentication.routes.js";
import { B2bConnectAuthenticationService } from "./authentication.service.js";
import type { B2bConnectAuthenticationConfig } from "./authentication.types.js";

export function createB2bConnectAuthenticationModule(config: B2bConnectAuthenticationConfig) {
  const service = new B2bConnectAuthenticationService(config);
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
    key: "b2bconnect.authentication",
    register(app: FastifyInstance) {
      registerB2bConnectAuthenticationRoutes(app, service);
    },
    service
  };
}
