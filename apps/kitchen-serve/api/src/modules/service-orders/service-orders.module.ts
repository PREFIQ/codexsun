import type { FastifyInstance } from "fastify";
import { registerServiceOrdersRoutes } from "./service-orders.routes.js";
export const serviceOrdersModule = {
  key: "kitchen-serve.service-orders",
  label: "Service Orders",
  scope: "tenant",
  register(app: FastifyInstance) {
    return registerServiceOrdersRoutes(app);
  }
};
