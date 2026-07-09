import type { FastifyInstance } from "fastify";
import { registerSizesRoutes } from "./sizes.routes.js";
export const sizesModule = { key: "core.common.products.sizes", register(app: FastifyInstance) { return registerSizesRoutes(app); } };
