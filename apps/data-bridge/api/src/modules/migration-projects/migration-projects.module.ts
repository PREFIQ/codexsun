import type { FastifyInstance } from "fastify";
import { registerMigrationProjectsRoutes } from "./migration-projects.routes.js";
import { MigrationProjectsService } from "./migration-projects.service.js";

export const migrationProjectsModule = {
  key: "migration.migration-projects",
  async register(app: FastifyInstance) {
    await registerMigrationProjectsRoutes(app, new MigrationProjectsService());
  }
};
