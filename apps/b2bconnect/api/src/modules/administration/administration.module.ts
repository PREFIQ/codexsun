import type { FastifyInstance } from "fastify";
import type { B2bConnectAuthenticationService } from "../authentication/index.js";
import { registerB2bConnectAdministrationRoutes } from "./administration.routes.js";
import { B2bConnectAdministrationService } from "./administration.service.js";

export function createB2bConnectAdministrationModule(
  authentication: B2bConnectAuthenticationService
) {
  const service = new B2bConnectAdministrationService();
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
    key: "b2bconnect.administration",
    register(app: FastifyInstance) {
      registerB2bConnectAdministrationRoutes(app, authentication, service);
    }
  };
}
