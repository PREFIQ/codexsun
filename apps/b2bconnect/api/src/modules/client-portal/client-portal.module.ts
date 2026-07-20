import type { FastifyInstance } from "fastify";
import type { B2bConnectAuthenticationService } from "../authentication/index.js";
import { registerB2bConnectClientPortalRoutes } from "./client-portal.routes.js";
import { B2bConnectClientPortalService } from "./client-portal.service.js";

export function createB2bConnectClientPortalModule(
  authentication: B2bConnectAuthenticationService
) {
  const service = new B2bConnectClientPortalService();
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
    key: "b2bconnect.client-portal",
    register(app: FastifyInstance) {
      registerB2bConnectClientPortalRoutes(app, authentication, service);
    }
  };
}
