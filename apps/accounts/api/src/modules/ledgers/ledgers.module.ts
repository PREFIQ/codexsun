import type { FastifyInstance } from "fastify";
import { registerLedgersRoutes } from "./ledgers.routes.js";

export const ledgersModule = {
  key: "accounts.ledgers",
  label: "Ledgers",
  scope: "tenant",
  register(app: FastifyInstance) {
    return registerLedgersRoutes(app);
  }
};
