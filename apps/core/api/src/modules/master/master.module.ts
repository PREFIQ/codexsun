import type { FastifyInstance } from "fastify";
import { registerMasterRoutes } from "./master.routes.js";
export const masterModule = { key: "core.master", register(app: FastifyInstance) { return registerMasterRoutes(app); } };
