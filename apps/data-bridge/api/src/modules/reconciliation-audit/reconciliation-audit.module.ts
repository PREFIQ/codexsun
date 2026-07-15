import type { FastifyInstance } from "fastify";
import { registerReconciliationAuditRoutes } from "./reconciliation-audit.routes.js";

export const reconciliationAuditModule = Object.freeze({
  key: "data-bridge.reconciliation-audit",
  scope: "platform",
  capabilities: ["row-hash-verification", "exceptions", "client-sign-off", "audit-export"]
});

export function registerReconciliationAuditModule(app: FastifyInstance) {
  return registerReconciliationAuditRoutes(app);
}
