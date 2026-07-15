import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { registerContractRoute } from "@codexsun/framework/http";
import { TransformsService } from "./transforms.service.js";

const path = "/data-bridge/transform-plans";
const idSchema = z.object({ id: z.coerce.number().int().positive() });
const fieldSchema = z.object({ sourceField: z.string(), targetField: z.string() });
const tableSchema = z.object({
  sourceTable: z.string(),
  targetTable: z.string(),
  group: z.string(),
  fields: z.array(fieldSchema),
  sourceQuery: z.string(),
  targetQuery: z.string()
});
const recordSchema = z.object({
  id: z.number(),
  mappingPlanId: z.number(),
  name: z.string(),
  status: z.enum(["draft", "approved"]),
  tables: z.array(tableSchema),
  createdAt: z.string(),
  updatedAt: z.string(),
  approvedAt: z.string().nullable().optional()
});
const approvalSchema = z.object({ status: z.enum(["draft", "approved"]) });

export async function registerTransformsRoutes(app: FastifyInstance) {
  const service = new TransformsService();
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
    handler: ({ params }) => service.get(params.id)
  });
  registerContractRoute(app, {
    method: "PUT",
    url: `${path}/:id/approval`,
    schemas: { body: approvalSchema, params: idSchema, response: recordSchema },
    handler: ({ body, params }) => service.setApproval(params.id, body.status)
  });
}
