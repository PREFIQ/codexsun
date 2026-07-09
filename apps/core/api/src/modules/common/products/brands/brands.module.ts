import type { FastifyInstance } from "fastify";
import { registerBrandsRoutes } from "./brands.routes.js";
export const brandsModule = { key: "core.common.products.brands", register(app: FastifyInstance) { return registerBrandsRoutes(app); } };
