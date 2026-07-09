import type { FastifyInstance } from "fastify";
import { registerAccountsSettingsRoutes } from "./settings.routes.js";

export const accountsSettingsModule = {
  key: "accounts.settings",
  label: "Accounts Settings",
  scope: "tenant",
  register(app: FastifyInstance) {
    return registerAccountsSettingsRoutes(app);
  }
};
