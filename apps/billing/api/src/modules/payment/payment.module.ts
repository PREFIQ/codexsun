import type { FastifyInstance } from "fastify";
import { registerPaymentRoutes } from "./payment.routes.js";
export const paymentModule = { key: "billing.payment", label: "Payment", register(app: FastifyInstance) { return registerPaymentRoutes(app); } };
