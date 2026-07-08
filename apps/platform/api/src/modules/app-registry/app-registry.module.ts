import type { FastifyInstance } from "fastify";
import { registerAppRegistryRoutes } from "./app-registry.routes.js";

export const appRegistryModule = {
  key: "platform.app-registry",
  label: "App Registry",
  register(app: FastifyInstance) {
    return registerAppRegistryRoutes(app);
  }
};
