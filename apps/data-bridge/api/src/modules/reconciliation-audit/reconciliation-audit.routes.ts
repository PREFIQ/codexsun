import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { AppError } from "@codexsun/framework/errors";
import { registerContractRoute } from "@codexsun/framework/http";
import { ReconciliationAuditService } from "./reconciliation-audit.service.js";

const path = "/data-bridge/reconciliation-reports";
const idSchema = z.object({ id: z.coerce.number().int().positive() });
const exceptionParamsSchema = z.object({
  id: z.coerce.number().int().positive(),
  exceptionId: z.string().min(3)
});
const tableSchema = z.object({
  sourceTable: z.string(),
  targetTable: z.string(),
  processedRows: z.number(),
  insertedRows: z.number(),
  overriddenRows: z.number(),
  rejectedRows: z.number(),
  verifiedRows: z.number(),
  missingRows: z.number(),
  mismatchedRows: z.number(),
  sourceHash: z.string(),
  targetHash: z.string()
});
const exceptionSchema = z.object({
  id: z.string(),
  table: z.string(),
  category: z.enum(["missing", "mismatch", "financial", "operator"]),
  details: z.string(),
  status: z.enum(["open", "resolved"]),
  createdBy: z.string(),
  createdAt: z.string(),
  resolvedBy: z.string().nullable(),
  resolvedAt: z.string().nullable(),
  resolution: z.string().nullable()
});
const signOffSchema = z.object({
  clientName: z.string(),
  clientReference: z.string(),
  signedBy: z.string(),
  note: z.string(),
  signedAt: z.string()
});
const recordSchema = z.object({
  id: z.number().int().positive(),
  executionRunId: z.number().int().positive(),
  reviewId: z.number().int().positive(),
  tenant: z.string(),
  name: z.string(),
  status: z.enum(["needs_attention", "pending_signoff", "signed_off"]),
  generatedBy: z.string(),
  generatedAt: z.string(),
  tables: z.array(tableSchema),
  exceptions: z.array(exceptionSchema),
  signOff: signOffSchema.nullable(),
  createdAt: z.string(),
  updatedAt: z.string()
});
const generateSchema = z.object({
  executionRunId: z.number().int().positive(),
  generatedBy: z.string().trim().min(2).max(160)
});
const addExceptionSchema = z.object({
  table: z.string().trim().min(1).max(160),
  category: z.enum(["missing", "mismatch", "financial", "operator"]),
  details: z.string().trim().min(3).max(1000),
  actor: z.string().trim().min(2).max(160)
});
const resolveSchema = z.object({
  actor: z.string().trim().min(2).max(160),
  resolution: z.string().trim().min(3).max(1000)
});
const signSchema = z.object({
  clientName: z.string().trim().min(2).max(160),
  clientReference: z.string().trim().min(2).max(160),
  signedBy: z.string().trim().min(2).max(160),
  note: z.string().trim().max(1000).default("")
});
const exportSchema = z.object({
  exportedAt: z.string(),
  report: recordSchema,
  checksum: z.string()
});

export async function registerReconciliationAuditRoutes(app: FastifyInstance) {
  const service = new ReconciliationAuditService();
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
    schemas: { body: generateSchema, response: recordSchema },
    handler: ({ body }) => service.generate(body.executionRunId, body.generatedBy)
  });
  registerContractRoute(app, {
    method: "POST",
    url: `${path}/:id/exceptions`,
    schemas: { body: addExceptionSchema, params: idSchema, response: recordSchema },
    handler: ({ body, params }) =>
      service.addException(params.id, body.table, body.category, body.details, body.actor)
  });
  registerContractRoute(app, {
    method: "POST",
    url: `${path}/:id/exceptions/:exceptionId/resolve`,
    schemas: { body: resolveSchema, params: exceptionParamsSchema, response: recordSchema },
    handler: ({ body, params }) =>
      service.resolveException(params.id, params.exceptionId, body.actor, body.resolution)
  });
  registerContractRoute(app, {
    method: "POST",
    url: `${path}/:id/sign-off`,
    schemas: { body: signSchema, params: idSchema, response: recordSchema },
    handler: ({ body, params }) =>
      service.signOff(params.id, body.clientName, body.clientReference, body.signedBy, body.note)
  });
  registerContractRoute(app, {
    method: "GET",
    url: `${path}/:id/audit-export`,
    schemas: { params: idSchema, response: exportSchema },
    handler: ({ params }) => service.auditExport(params.id)
  });
}

function required<T>(value: T | null): T {
  if (!value) throw AppError.notFound("Reconciliation report was not found.");
  return value;
}
