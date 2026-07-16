import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { AppError } from "@codexsun/framework/errors";
import { registerContractRoute } from "@codexsun/framework/http";
import { ReviewApprovalsService } from "./review-approvals.service.js";

const path = "/data-bridge/review-approvals";
const idSchema = z.object({ id: z.coerce.number().int().positive() });
const previewQuerySchema = z.object({
  table: z.string().trim().min(1).max(160),
  limit: z.coerce.number().int().min(1).max(100).default(25)
});
const recordValuesSchema = z.record(z.string(), z.unknown());
const previewSchema = z.object({
  sourceTable: z.string(),
  targetTable: z.string(),
  sourceFields: z.array(z.string()),
  targetFields: z.array(z.string()),
  rows: z.array(
    z.object({
      key: z.string(),
      identityValues: recordValuesSchema,
      sourceValues: recordValuesSchema,
      mappedValues: recordValuesSchema,
      targetValues: recordValuesSchema.nullable(),
      status: z.enum(["new", "match", "different", "invalid"]),
      targetIdentityMode: z.enum(["preserve", "generate"]).nullable()
    })
  )
});
const tableSchema = z.object({
  sourceTable: z.string(),
  targetTable: z.string(),
  mappedFieldCount: z.number().int().nonnegative(),
  identityFields: z.array(z.string()),
  sourceCount: z.number().int().nonnegative(),
  targetCount: z.number().int().nonnegative(),
  blockingRisks: z.array(z.string()),
  warnings: z.array(z.string())
});
const statusSchema = z.enum(["pending", "approved", "rejected", "revoked"]);
const recordSchema = z.object({
  id: z.number().int().positive(),
  transformPlanId: z.number().int().positive(),
  mappingPlanId: z.number().int().positive(),
  migrationJobId: z.number().int().positive(),
  tenant: z.string(),
  planName: z.string(),
  checksum: z.string(),
  status: statusSchema,
  preparedBy: z.string(),
  preparedAt: z.string(),
  dryRunSucceeded: z.boolean(),
  totalSourceRows: z.number().int().nonnegative(),
  totalTargetRows: z.number().int().nonnegative(),
  tables: z.array(tableSchema),
  approvalReference: z.string().nullable(),
  approver: z.string().nullable(),
  decisionReason: z.string().nullable(),
  decidedAt: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string()
});
const candidateSchema = z.object({
  transformPlanId: z.number().int().positive(),
  mappingPlanId: z.number().int().positive(),
  name: z.string(),
  status: z.literal("approved"),
  tableCount: z.number().int().nonnegative(),
  reviewId: z.number().int().positive().nullable(),
  reviewStatus: statusSchema.nullable()
});
const prepareSchema = z.object({
  transformPlanId: z.number().int().positive(),
  preparedBy: z.string().trim().min(2).max(160)
});
const approveSchema = z.object({
  approver: z.string().trim().min(2).max(160),
  approvalReference: z.string().trim().min(3).max(160),
  reason: z.string().trim().min(3).max(1000)
});
const decisionSchema = z.object({
  actor: z.string().trim().min(2).max(160),
  reason: z.string().trim().min(3).max(1000)
});

export async function registerReviewApprovalsRoutes(app: FastifyInstance) {
  const service = new ReviewApprovalsService();
  await service.initialize();
  registerContractRoute(app, {
    method: "GET",
    url: path,
    schemas: { response: z.array(recordSchema) },
    handler: () => service.list()
  });
  registerContractRoute(app, {
    method: "GET",
    url: `${path}/candidates`,
    schemas: { response: z.array(candidateSchema) },
    handler: () => service.candidates()
  });
  registerContractRoute(app, {
    method: "GET",
    url: `${path}/:id`,
    schemas: { params: idSchema, response: recordSchema },
    handler: async ({ params }) => required(await service.get(params.id))
  });
  registerContractRoute(app, {
    method: "GET",
    url: `${path}/:id/records`,
    schemas: { params: idSchema, querystring: previewQuerySchema, response: previewSchema },
    handler: ({ params, query }) => service.preview(params.id, query.table, query.limit)
  });
  registerContractRoute(app, {
    method: "POST",
    url: path,
    schemas: { body: prepareSchema, response: recordSchema },
    handler: ({ body }) => service.prepare(body.transformPlanId, body.preparedBy)
  });
  registerContractRoute(app, {
    method: "POST",
    url: `${path}/:id/refresh`,
    schemas: { params: idSchema, response: recordSchema },
    handler: ({ params }) => service.refresh(params.id)
  });
  registerContractRoute(app, {
    method: "POST",
    url: `${path}/:id/approve`,
    schemas: { body: approveSchema, params: idSchema, response: recordSchema },
    handler: ({ body, params }) =>
      service.approve(params.id, body.approver, body.approvalReference, body.reason)
  });
  for (const action of ["reject", "revoke"] as const) {
    registerContractRoute(app, {
      method: "POST",
      url: `${path}/:id/${action}`,
      schemas: { body: decisionSchema, params: idSchema, response: recordSchema },
      handler: ({ body, params }) => service[action](params.id, body.actor, body.reason)
    });
  }
}

function required<T>(value: T | null): T {
  if (!value) throw AppError.notFound("Review was not found.");
  return value;
}
