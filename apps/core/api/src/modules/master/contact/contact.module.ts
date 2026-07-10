import type { FastifyInstance } from "fastify";
import { masterModule } from "../master.module.js";
export const contactModule = { key: "core.master.contact", register(app: FastifyInstance) { return masterModule.register(app); } };
