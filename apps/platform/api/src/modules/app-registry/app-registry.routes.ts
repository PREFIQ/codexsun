import type { FastifyInstance } from "fastify";
import { ok } from "@codexsun/framework/http";
import { AppRegistryRepository } from "./app-registry.repository.js";

const repository = new AppRegistryRepository();

export async function registerAppRegistryRoutes(app: FastifyInstance) {
  app.get("/admin/apps", async (request) => ok(await repository.list(), { requestId: request.id }));
}
