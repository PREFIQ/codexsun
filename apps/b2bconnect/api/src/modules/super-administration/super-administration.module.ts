import type { FastifyInstance } from "fastify";
import type { B2bConnectAuthenticationService } from "../authentication/index.js";
import { registerB2bConnectSuperAdministrationRoutes } from "./super-administration.routes.js";
import { B2bConnectSuperAdministrationService } from "./super-administration.service.js";

export function createB2bConnectSuperAdministrationModule(
  authentication: B2bConnectAuthenticationService
) {
  const service = new B2bConnectSuperAdministrationService();
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
    key: "b2bconnect.super-administration",
    register(app: FastifyInstance) {
      registerB2bConnectSuperAdministrationRoutes(app, authentication, service);
    }
  };
}
