import type { FastifyInstance } from "fastify";
import { registerProjectManagerRoutes } from "./project-manager.routes.js";

export const projectManagerModule = {
  key: "platform.project-manager",
  label: "Project Manager",
  register(app: FastifyInstance) {
    return registerProjectManagerRoutes(app);
  }
};
