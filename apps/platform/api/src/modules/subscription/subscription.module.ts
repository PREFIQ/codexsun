import type { FastifyInstance } from "fastify"; import { registerSubscriptionRoutes } from "./subscription.routes.js";
export const subscriptionModule = { key: "platform.subscription", label: "Subscriptions", register(app: FastifyInstance) { return registerSubscriptionRoutes(app); } };
