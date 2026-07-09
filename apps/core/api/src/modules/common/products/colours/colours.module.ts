import type { FastifyInstance } from "fastify";
import { registerColoursRoutes } from "./colours.routes.js";
export const coloursModule = { key: "core.common.products.colours", register(app: FastifyInstance) { return registerColoursRoutes(app); } };
