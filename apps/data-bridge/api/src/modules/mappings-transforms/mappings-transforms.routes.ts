import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { registerContractRoute } from "@codexsun/framework/http";
import { MappingsTransformsService } from "./mappings-transforms.service.js";

const path = "/data-bridge/mapping-plans";
const idSchema = z.object({ id: z.coerce.number().int().positive() });
const fieldSchema = z.object({
  sourceColumn: z.string().min(1),
  targetColumn: z.string(),
  skipped: z.boolean().optional()
});
const mappingSchema = z.object({
  sourceTable: z.string().min(1),
  targetTable: z.string().min(1),
  group: z.string().optional(),
  fields: z.array(fieldSchema)
});
const summarySchema = z.object({
  id: z.number(),
  discoverySnapshotId: z.number(),
  name: z.string(),
  status: z.enum(["draft", "ready"]),
  mappings: z.array(mappingSchema),
  createdAt: z.string(),
  updatedAt: z.string(),
  migrationJobId: z.number(),
  jobName: z.string()
});
const columnSchema = z.object({
  name: z.string(),
  type: z.string(),
  nullable: z.boolean(),
  defaultValue: z.string().nullable(),
  key: z.string(),
  extra: z.string()
});
const tableSchema = z.object({
  name: z.string(),
  type: z.string(),
  estimatedRows: z.number(),
  columns: z.array(columnSchema)
});
const detailsSchema = z.object({
  id: z.number(),
  discoverySnapshotId: z.number(),
  name: z.string(),
  status: z.enum(["draft", "ready"]),
  mappings: z.array(mappingSchema),
  createdAt: z.string(),
  updatedAt: z.string(),
  jobName: z.string(),
  mappingInput: z.unknown().nullable(),
  sourceTables: z.array(tableSchema),
  targetTables: z.array(tableSchema)
});
const createSchema = z.object({
  discoverySnapshotId: z.number().int().positive(),
  name: z.string().trim().min(1).max(160).optional()
});
const updateSchema = z.object({
  name: z.string().trim().min(1).max(160),
  status: z.enum(["draft", "ready"]),
  mappings: z.array(mappingSchema)
});
const createdSchema = z.object({ id: z.number().int().positive() });
const savedSchema = z.object({ saved: z.literal(true) });
const deletedSchema = z.object({ deleted: z.literal(true), id: z.number().int().positive() });

export async function registerMappingsTransformsRoutes(app: FastifyInstance) {
  const service = new MappingsTransformsService();
  await service.initialize();
  registerContractRoute(app, {
    method: "GET",
    url: path,
    schemas: { response: z.array(summarySchema) },
    handler: () => service.list()
  });
  registerContractRoute(app, {
    method: "GET",
    url: `${path}/:id`,
    schemas: { params: idSchema, response: detailsSchema },
    handler: ({ params }) => service.get(params.id)
  });
  registerContractRoute(app, {
    method: "POST",
    url: path,
    schemas: { body: createSchema, response: createdSchema },
    handler: async ({ body }) => ({
      id: (await service.create(body.discoverySnapshotId, body.name)).id
    })
  });
  registerContractRoute(app, {
    method: "PUT",
    url: `${path}/:id`,
    schemas: { body: updateSchema, params: idSchema, response: savedSchema },
    handler: async ({ body, params }) => {
      await service.update(params.id, body.name, body.status, body.mappings);
      return { saved: true as const };
    }
  });
  registerContractRoute(app, {
    method: "DELETE",
    url: `${path}/:id`,
    schemas: { params: idSchema, response: deletedSchema },
    handler: ({ params }) => service.delete(params.id)
  });
}
