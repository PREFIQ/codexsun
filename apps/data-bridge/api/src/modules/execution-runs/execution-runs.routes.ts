import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { AppError } from "@codexsun/framework/errors";
import { registerContractRoute } from "@codexsun/framework/http";
import { ExecutionRunsService } from "./execution-runs.service.js";

const path = "/data-bridge/execution-runs";
const idSchema = z.object({ id: z.coerce.number().int().positive() });
const conflictParamsSchema = z.object({
  id: z.coerce.number().int().positive(),
  conflictId: z.string().min(3)
});
const statusSchema = z.enum([
  "queued",
  "running",
  "paused",
  "blocked",
  "completed",
  "failed",
  "cancelled"
]);
const tableSchema = z.object({
  sourceTable: z.string(),
  targetTable: z.string(),
  status: z.union([statusSchema, z.literal("pending")]),
  totalRows: z.number().int().nonnegative(),
  checkpoint: z.number().int().nonnegative(),
  insertedRows: z.number().int().nonnegative(),
  overriddenRows: z.number().int().nonnegative(),
  rejectedRows: z.number().int().nonnegative(),
  conflictCount: z.number().int().nonnegative(),
  error: z.string().nullable()
});
const decisionSchema = z.object({
  action: z.enum(["override", "reject"]),
  actor: z.string(),
  reason: z.string(),
  decidedAt: z.string()
});
const conflictSchema = z.object({
  id: z.string(),
  table: z.string(),
  sourceRecordRef: z.string(),
  targetRecordRef: z.string(),
  status: z.enum(["pending", "decided", "applied"]),
  decision: decisionSchema.nullable(),
  detectedAt: z.string()
});
const recordSchema = z.object({
  id: z.number().int().positive(),
  reviewId: z.number().int().positive(),
  transformPlanId: z.number().int().positive(),
  migrationJobId: z.number().int().positive(),
  tenant: z.string(),
  name: z.string(),
  checksum: z.string(),
  approvalReference: z.string(),
  requestedBy: z.string(),
  batchSize: z.number().int().positive(),
  selectionMode: z.enum(["all", "selected"]).optional(),
  selectedRecordCount: z.number().int().nonnegative().optional(),
  status: statusSchema,
  tables: z.array(tableSchema),
  conflicts: z.array(conflictSchema),
  currentTable: z.string().nullable(),
  startedAt: z.string().nullable(),
  finishedAt: z.string().nullable(),
  error: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string()
});
const createSchema = z.object({
  reviewId: z.number().int().positive(),
  requestedBy: z.string().trim().min(2).max(160),
  batchSize: z.number().int().min(1).max(1000).default(100)
});
const selectedCreateSchema = createSchema.extend({
  selections: z
    .array(
      z.object({
        targetTable: z.string().trim().min(1).max(160),
        identityValues: z.record(z.string(), z.unknown()),
        targetIdentityMode: z.enum(["preserve", "generate"])
      })
    )
    .min(1)
    .max(1000)
});
const actorSchema = z.object({ actor: z.string().trim().min(2).max(160) });
const conflictDecisionSchema = z.object({
  action: z.enum(["override", "reject"]),
  actor: z.string().trim().min(2).max(160),
  reason: z.string().trim().min(3).max(1000)
});

export async function registerExecutionRunsRoutes(app: FastifyInstance) {
  const service = new ExecutionRunsService();
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
    handler: async ({ params }) => required(await service.get(params.id))
  });
  registerContractRoute(app, {
    method: "POST",
    url: path,
    schemas: { body: createSchema, response: recordSchema },
    handler: ({ body }) => service.create(body.reviewId, body.requestedBy, body.batchSize)
  });
  registerContractRoute(app, {
    method: "POST",
    url: `${path}/selected`,
    schemas: { body: selectedCreateSchema, response: recordSchema },
    handler: ({ body }) =>
      service.createSelected(body.reviewId, body.requestedBy, body.batchSize, body.selections)
  });
  for (const action of ["pause", "resume", "cancel", "retry"] as const) {
    registerContractRoute(app, {
      method: "POST",
      url: `${path}/:id/${action}`,
      schemas: { body: actorSchema, params: idSchema, response: recordSchema },
      handler: ({ body, params }) => service[action](params.id, body.actor)
    });
  }
  registerContractRoute(app, {
    method: "POST",
    url: `${path}/:id/conflicts/:conflictId/decision`,
    schemas: { body: conflictDecisionSchema, params: conflictParamsSchema, response: recordSchema },
    handler: ({ body, params }) =>
      service.decideConflict(params.id, params.conflictId, body.action, body.actor, body.reason)
  });
}

function required<T>(value: T | null): T {
  if (!value) throw AppError.notFound("Execution run was not found.");
  return value;
}
