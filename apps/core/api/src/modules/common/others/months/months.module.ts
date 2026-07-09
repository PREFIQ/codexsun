import type { FastifyInstance } from "fastify";
import { registerMonthsRoutes } from "./months.routes.js";
export const monthsModule = { key: "core.common.others.months", register(app: FastifyInstance) { return registerMonthsRoutes(app); } };
