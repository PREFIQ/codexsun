import type { FastifyInstance } from "fastify";
import { registerHsnCodesRoutes } from "./hsn-codes.routes.js";
export const hsnCodesModule = { key: "core.common.products.hsnCodes", register(app: FastifyInstance) { return registerHsnCodesRoutes(app); } };
