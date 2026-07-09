import type { FastifyInstance } from "fastify";
import { registerContactTypesRoutes } from "./contact-types.routes.js";
export const contactTypesModule = { key: "core.common.contacts.contactTypes", register(app: FastifyInstance) { return registerContactTypesRoutes(app); } };
