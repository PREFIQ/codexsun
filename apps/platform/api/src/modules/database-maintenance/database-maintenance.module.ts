import type { FastifyInstance } from "fastify";
import { registerDatabaseMaintenanceRoutes } from "./database-maintenance.routes.js";
export const databaseMaintenanceModule = { key: "platform.database-maintenance", label: "Database Maintenance", register(app: FastifyInstance) { return registerDatabaseMaintenanceRoutes(app); } };
