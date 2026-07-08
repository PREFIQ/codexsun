import type { FastifyInstance } from "fastify";
import { registerAccessControlRoutes } from "./access-control.routes.js";
export const accessControlModule = { key: "platform.access-control", label: "Access Control", register(app: FastifyInstance) { return registerAccessControlRoutes(app); } };
