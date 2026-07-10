import type { FastifyInstance } from "fastify";
import { registerEntriesRoutes } from "./entries.routes.js";

export const entriesModule = {
  key: "billing.entries",
  register(app: FastifyInstance) {
    return registerEntriesRoutes(app);
  }
};
