import type { FastifyInstance } from "fastify";
import { registerReportsRoutes } from "./reports.routes.js";

export const reportsModule = {
  key: "accounts.reports",
  label: "Reports",
  scope: "tenant",
  register(app: FastifyInstance) {
    return registerReportsRoutes(app);
  }
};
