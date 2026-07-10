import type { FastifyInstance } from "fastify";
import { masterModule } from "../master.module.js";
export const workOrderModule = { key: "core.master.workOrder", register(app: FastifyInstance) { return masterModule.register(app); } };
