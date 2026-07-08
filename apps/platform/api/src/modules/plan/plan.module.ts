import type { FastifyInstance } from "fastify";
import { registerPlanRoutes } from "./plan.routes.js";
export const planModule = { key: "platform.plan", label: "Plans", register(app: FastifyInstance) { return registerPlanRoutes(app); } };
