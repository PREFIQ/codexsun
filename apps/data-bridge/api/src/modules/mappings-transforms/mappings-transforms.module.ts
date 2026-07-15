import type { FastifyInstance } from "fastify";
import { registerMappingsTransformsRoutes } from "./mappings-transforms.routes.js";

export const mappingsTransformsModule = Object.freeze({
  key: "data-bridge.mappings-transforms",
  scope: "platform"
});
export function registerMappingsTransformsModule(app: FastifyInstance) {
  return registerMappingsTransformsRoutes(app);
}
