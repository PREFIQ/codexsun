import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { registerContractRoute } from "@codexsun/framework/http";
import { AppError } from "@codexsun/framework/errors";
import { MigrationManagerService } from "./migration-manager.service.js";

const path = "/data-bridge/migration-jobs";
const idSchema = z.object({ id: z.coerce.number().int().positive() });
const smokeParamsSchema = z.object({
  id: z.coerce.number().int().positive(),
  side: z.enum(["source", "target"])
});
const databaseSchema = z.object({
  database: z.string().trim().min(1),
  host: z.string().trim().min(1),
  password: z.string().default(""),
  port: z.coerce.number().int().positive(),
  type: z.enum(["mariadb", "mysql2"]),
  user: z.string().trim().min(1)
});
const payloadSchema = z.object({
  name: z.string().trim().min(1).max(160),
  tenant: z.string().trim().min(1).max(160),
  status: z.enum(["draft", "ready", "running", "completed", "failed"]),
  source: databaseSchema,
  target: databaseSchema
});
const recordSchema = payloadSchema.extend({
  id: z.number().int().positive(),
  createdAt: z.string(),
  updatedAt: z.string()
});
const smokeSchema = z.object({
  connected: z.boolean(),
  position: z.string(),
  responseMs: z.number().nullable()
});

export async function registerMigrationManagerRoutes(app: FastifyInstance) {
  const service = new MigrationManagerService();
  await service.initialize();
  registerContractRoute(app, {
    method: "GET",
    url: path,
    schemas: { response: z.array(recordSchema) },
    handler: () => service.list()
  });
  registerContractRoute(app, {
    method: "GET",
    url: `${path}/:id`,
    schemas: { params: idSchema, response: recordSchema },
    handler: async ({ params }) => {
      const job = await service.get(params.id);
      if (!job) throw AppError.notFound("Migration job was not found.");
      return job;
    }
  });
  registerContractRoute(app, {
    method: "POST",
    url: path,
    schemas: { body: payloadSchema, response: recordSchema },
    handler: ({ body }) => service.create(body)
  });
  registerContractRoute(app, {
    method: "PUT",
    url: `${path}/:id`,
    schemas: { body: payloadSchema, params: idSchema, response: recordSchema },
    handler: ({ body, params }) => service.update(params.id, body)
  });
  registerContractRoute(app, {
    method: "POST",
    url: `${path}/:id/smoke-test/:side`,
    schemas: { params: smokeParamsSchema, response: smokeSchema },
    handler: ({ params }) => service.smokeTest(params.id, params.side)
  });
}
