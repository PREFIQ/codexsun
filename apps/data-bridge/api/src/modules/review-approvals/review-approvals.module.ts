import type { FastifyInstance } from "fastify";
import { registerReviewApprovalsRoutes } from "./review-approvals.routes.js";

export const reviewApprovalsModule = Object.freeze({
  key: "data-bridge.review-approvals",
  scope: "platform",
  capabilities: ["dry-run", "separation-of-duties", "immutable-checksum"]
});

export function registerReviewApprovalsModule(app: FastifyInstance) {
  return registerReviewApprovalsRoutes(app);
}
