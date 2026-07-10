import type { FastifyInstance } from "fastify";
import { masterModule } from "../master.module.js";
export const productModule = { key: "core.master.product", register(app: FastifyInstance) { return masterModule.register(app); } };
