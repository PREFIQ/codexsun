import type { FastifyInstance } from "fastify";
import { registerReceiptRoutes } from "./receipt.routes.js";
export const receiptModule = { key: "billing.receipt", label: "Receipt", register(app: FastifyInstance) { return registerReceiptRoutes(app); } };
