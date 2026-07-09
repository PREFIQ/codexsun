import type { FastifyInstance } from "fastify";
import { registerContactGroupsRoutes } from "./contact-groups.routes.js";
export const contactGroupsModule = { key: "core.common.contacts.contactGroups", register(app: FastifyInstance) { return registerContactGroupsRoutes(app); } };
