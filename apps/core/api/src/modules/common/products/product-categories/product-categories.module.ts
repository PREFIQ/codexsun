import type { FastifyInstance } from "fastify";
import { registerProductCategoriesRoutes } from "./product-categories.routes.js";
export const productCategoriesModule = { key: "core.common.products.productCategories", register(app: FastifyInstance) { return registerProductCategoriesRoutes(app); } };
