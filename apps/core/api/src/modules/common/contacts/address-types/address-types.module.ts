import type { FastifyInstance } from "fastify";
import { registerAddressTypesRoutes } from "./address-types.routes.js";
export const addressTypesModule = { key: "core.common.contacts.addressTypes", register(app: FastifyInstance) { return registerAddressTypesRoutes(app); } };
