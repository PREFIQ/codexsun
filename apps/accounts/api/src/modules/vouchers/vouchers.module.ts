import type { FastifyInstance } from "fastify";
import { registerVouchersRoutes } from "./vouchers.routes.js";

export const vouchersModule = {
  key: "accounts.vouchers",
  label: "Vouchers",
  scope: "tenant",
  register(app: FastifyInstance) {
    return registerVouchersRoutes(app);
  }
};
