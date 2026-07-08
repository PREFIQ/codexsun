import type { FastifyInstance } from "fastify";
import { registerPlatformActivityRoutes } from "./platform-activity.routes.js";
export const platformActivityModule = { key: "platform.activity", label: "Activity", register(app: FastifyInstance) { return registerPlatformActivityRoutes(app); } };
