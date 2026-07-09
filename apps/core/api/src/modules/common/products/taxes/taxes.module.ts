import type { FastifyInstance } from "fastify";
import { registerTaxesRoutes } from "./taxes.routes.js";
export const taxesModule = { key: "core.common.products.taxes", register(app: FastifyInstance) { return registerTaxesRoutes(app); } };
