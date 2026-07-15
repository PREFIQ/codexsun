import type { FastifyInstance } from "fastify";
import { registerTransformsRoutes } from "./transforms.routes.js";

export const transformsModule = Object.freeze({ key: "data-bridge.transforms", scope: "platform" });
export function registerTransformsModule(app: FastifyInstance) {
  return registerTransformsRoutes(app);
}
