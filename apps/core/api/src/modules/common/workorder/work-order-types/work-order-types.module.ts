import type { FastifyInstance } from "fastify";
import { registerWorkOrderTypesRoutes } from "./work-order-types.routes.js";
export const workOrderTypesModule = { key: "core.common.workorder.workOrderTypes", register(app: FastifyInstance) { return registerWorkOrderTypesRoutes(app); } };
