import type { FastifyInstance } from "fastify";
import { registerCommonRoutes } from "./common.routes.js";

export const commonModule = {
  key: "core.common",
  label: "Common",
  register(app: FastifyInstance) {
    return registerCommonRoutes(app);
  }
};

