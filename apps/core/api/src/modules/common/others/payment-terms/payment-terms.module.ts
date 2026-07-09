import type { FastifyInstance } from "fastify";
import { registerPaymentTermsRoutes } from "./payment-terms.routes.js";
export const paymentTermsModule = { key: "core.common.others.paymentTerms", register(app: FastifyInstance) { return registerPaymentTermsRoutes(app); } };
