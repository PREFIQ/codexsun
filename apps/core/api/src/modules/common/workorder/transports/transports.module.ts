import type { FastifyInstance } from "fastify";
import { registerTransportsRoutes } from "./transports.routes.js";
export const transportsModule = { key: "core.common.workorder.transports", register(app: FastifyInstance) { return registerTransportsRoutes(app); } };
