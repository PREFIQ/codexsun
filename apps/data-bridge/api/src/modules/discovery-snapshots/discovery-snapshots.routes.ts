import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { AppError } from "@codexsun/framework/errors";
import { registerContractRoute } from "@codexsun/framework/http";
import { DiscoverySnapshotsService } from "./discovery-snapshots.service.js";

const path = "/data-bridge/discovery-snapshots";
const idSchema = z.object({ id: z.coerce.number().int().positive() });
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
const differenceSchema = z.object({
  table: z.string(),
  status: z.enum(["match", "missing-target", "target-only", "different"]),
  differences: z.array(z.string())
});
const summarySchema = z.object({
  id: z.number(),
  migrationJobId: z.number(),
  jobName: z.string(),
  sourceDatabase: z.string(),
  targetDatabase: z.string(),
  sourceTableCount: z.number(),
  targetTableCount: z.number(),
  differenceCount: z.number(),
  preparedAt: z.string().nullable(),
  createdAt: z.string()
});
const recordSchema = summarySchema.extend({
  source: z.array(tableSchema),
  target: z.array(tableSchema),
  comparison: z.array(differenceSchema),
  omittedTables: z.array(z.string()),
  tableMappings: z.record(z.string(), z.string()),
  tableGroups: z.record(z.string(), z.string()),
  mappingInput: z.unknown().nullable()
});
const stringArraySchema = z.object({ tables: z.array(z.string()) });
const mappingsSchema = z.object({ mappings: z.record(z.string(), z.string()) });
const groupsSchema = z.object({ groups: z.record(z.string(), z.string()) });
const createSchema = z.object({ migrationJobId: z.number().int().positive() });
const deletedSchema = z.object({ deleted: z.literal(true) });

export async function registerDiscoverySnapshotRoutes(app: FastifyInstance) {
  const service = new DiscoverySnapshotsService();
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
    schemas: { params: idSchema, response: recordSchema },
    handler: async ({ params }) => required(await service.get(params.id))
  });
  registerContractRoute(app, {
    method: "PATCH",
    url: `${path}/:id/omitted-tables`,
    schemas: { body: stringArraySchema, params: idSchema, response: recordSchema },
    handler: async ({ body, params }) =>
      required(await service.setOmittedTables(params.id, body.tables))
  });
  registerContractRoute(app, {
    method: "PATCH",
    url: `${path}/:id/table-mappings`,
    schemas: { body: mappingsSchema, params: idSchema, response: recordSchema },
    handler: async ({ body, params }) =>
      required(await service.setTableMappings(params.id, body.mappings))
  });
  registerContractRoute(app, {
    method: "PATCH",
    url: `${path}/:id/table-groups`,
    schemas: { body: groupsSchema, params: idSchema, response: recordSchema },
    handler: async ({ body, params }) =>
      required(await service.setTableGroups(params.id, body.groups))
  });
  registerContractRoute(app, {
    method: "POST",
    url: `${path}/:id/prepare-mappings`,
    schemas: { params: idSchema, response: recordSchema },
    handler: async ({ params }) => required(await service.prepare(params.id))
  });
  registerContractRoute(app, {
    method: "DELETE",
    url: `${path}/:id`,
    schemas: { params: idSchema, response: deletedSchema },
    handler: async ({ params }) => {
      if (!(await service.delete(params.id)))
        throw AppError.notFound("Discovery snapshot was not found.");
      return { deleted: true as const };
    }
  });
  registerContractRoute(app, {
    method: "POST",
    url: path,
    schemas: { body: createSchema, response: recordSchema },
    handler: async ({ body }) => required(await service.create(body.migrationJobId))
  });
}
function required<T>(value: T | null): T {
  if (!value) throw AppError.notFound("Discovery snapshot was not found.");
  return value;
}
