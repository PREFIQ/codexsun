import type { FastifyInstance } from "fastify";
import { registerProductTypesRoutes } from "./product-types.routes.js";
export const productTypesModule = { key: "core.common.products.productTypes", register(app: FastifyInstance) { return registerProductTypesRoutes(app); } };
