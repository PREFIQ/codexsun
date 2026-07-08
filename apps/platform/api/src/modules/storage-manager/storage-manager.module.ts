import type { FastifyInstance } from "fastify";
import { registerStorageManagerRoutes } from "./storage-manager.routes.js";

export const storageManagerModule = {
  key: "platform.storage-manager",
  label: "Storage Manager",
  register(app: FastifyInstance) {
    return registerStorageManagerRoutes(app);
  }
};
