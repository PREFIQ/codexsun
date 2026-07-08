import type { FastifyInstance } from "fastify";
import { registerQueueManagerRoutes } from "./queue-manager.routes.js";

export const queueManagerModule = {
  key: "platform.queue-manager",
  label: "Queue Manager",
  register(app: FastifyInstance) {
    return registerQueueManagerRoutes(app);
  }
};
