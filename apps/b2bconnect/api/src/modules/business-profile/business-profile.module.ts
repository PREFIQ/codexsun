import type { FastifyInstance } from "fastify";
import type { B2bConnectDatabase } from "../../database.js";
import type { B2bConnectAuthenticationService } from "../authentication/index.js";
import { migrateBusinessProfileModule } from "./business-profile.migration.js";
import { BusinessProfileRepository } from "./business-profile.repository.js";
import { registerBusinessProfileRoutes } from "./business-profile.routes.js";
import { BusinessProfileService } from "./business-profile.service.js";

export function createBusinessProfileModule(
  database: B2bConnectDatabase,
  authentication: B2bConnectAuthenticationService
) {
  migrateBusinessProfileModule(database);
  const service = new BusinessProfileService(new BusinessProfileRepository(database));
  return {
    capabilityExemptions: ["seed", "delete", "force-delete", "events", "worker", "sync"] as const,
    key: "b2bconnect.business-profile",
    register(app: FastifyInstance) {
      registerBusinessProfileRoutes(app, authentication, service);
    },
    service
  };
}
