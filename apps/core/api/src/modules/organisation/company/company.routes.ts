import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { AppError } from "@codexsun/framework/errors";
import { registerContractRoute } from "@codexsun/framework/http";
import { CompanyService } from "./company.service.js";

export const COMPANY_COLLECTION_PATH = "/core/organisation/companies";
export const COMPANY_INDUSTRY_LOOKUP_PATH = "/core/organisation/industries";
const service = new CompanyService();
const idSchema = z.object({ id: z.string().regex(/^\d+$/, "Company ID must be numeric.") });
const childValueSchema = z.union([z.boolean(), z.number(), z.string(), z.null()]);
const childSchema = z
  .record(z.string(), childValueSchema)
  .and(z.object({ id: z.union([z.number(), z.string()]) }));
const nullableString = z.string().trim().nullable();
const nullableId = z.number().int().positive().nullable();
const statusSchema = z.enum(["active", "inactive", "suspend"]);
const companySchema = z.object({
  id: z.number().int().positive(),
  code: z.string(),
  name: z.string(),
  legalName: nullableString,
  primaryPhone: nullableString,
  primaryEmail: nullableString,
  gstin: nullableString,
  pan: nullableString,
  website: nullableString,
  description: nullableString,
  logoPath: nullableString,
  logoDarkPath: nullableString,
  industryId: nullableId,
  industryName: nullableString,
  status: statusSchema,
  isActive: z.boolean(),
  emails: z.array(childSchema),
  phones: z.array(childSchema),
  addresses: z.array(childSchema),
  bankAccounts: z.array(childSchema),
  socialLinks: z.array(childSchema),
  createdAt: z.string(),
  updatedAt: z.string()
});
const payloadSchema = z.object({
  code: z.string().trim().optional(),
  name: z.string().trim().min(1, "Company name is required."),
  legalName: nullableString.optional(),
  primaryPhone: nullableString.optional(),
  primaryEmail: nullableString.optional(),
  gstin: nullableString.optional(),
  pan: nullableString.optional(),
  website: nullableString.optional(),
  description: nullableString.optional(),
  logoPath: nullableString.optional(),
  logoDarkPath: nullableString.optional(),
  industryId: nullableId.optional(),
  industryName: nullableString.optional(),
  status: statusSchema.optional(),
  isActive: z.boolean().optional(),
  emails: z.array(childSchema).optional(),
  phones: z.array(childSchema).optional(),
  addresses: z.array(childSchema).optional(),
  bankAccounts: z.array(childSchema).optional(),
  socialLinks: z.array(childSchema).optional()
});
const querySchema = z.object({ search: z.string().trim().optional() });
const industrySchema = z.object({
  code: z.string(),
  id: z.number().int().positive(),
  name: z.string()
});

export async function registerCompanyRoutes(app: FastifyInstance) {
  registerContractRoute(app, {
    handler: () => service.listIndustries(),
    method: "GET",
    schemas: { response: z.array(industrySchema) },
    url: COMPANY_INDUSTRY_LOOKUP_PATH
  });
  registerContractRoute(app, {
    handler: ({ query }) => service.list(query.search ?? ""),
    method: "GET",
    schemas: { querystring: querySchema, response: z.array(companySchema) },
    url: COMPANY_COLLECTION_PATH
  });
  registerContractRoute(app, {
    handler: async ({ params }) => required(await service.find(params.id)),
    method: "GET",
    schemas: { params: idSchema, response: companySchema },
    url: `${COMPANY_COLLECTION_PATH}/:id`
  });
  registerContractRoute(app, {
    handler: ({ body }) => service.create(body),
    method: "POST",
    schemas: { body: payloadSchema, response: companySchema },
    url: COMPANY_COLLECTION_PATH
  });
  registerContractRoute(app, {
    handler: async ({ body, params }) => required(await service.update(params.id, body)),
    method: "PUT",
    schemas: { body: payloadSchema, params: idSchema, response: companySchema },
    url: `${COMPANY_COLLECTION_PATH}/:id`
  });
  lifecycle(app, "activate", true);
  lifecycle(app, "deactivate", false);
  registerContractRoute(app, {
    handler: async ({ params }) => required(await service.forceDelete(params.id)),
    method: "DELETE",
    schemas: { params: idSchema, response: companySchema },
    url: `${COMPANY_COLLECTION_PATH}/:id/force`
  });
}
function lifecycle(app: FastifyInstance, action: "activate" | "deactivate", active: boolean) {
  registerContractRoute(app, {
    handler: async ({ params }) => required(await service.setActive(params.id, active)),
    method: "POST",
    schemas: { params: idSchema, response: companySchema },
    url: `${COMPANY_COLLECTION_PATH}/:id/${action}`
  });
}
function required<T>(record: T | null): T {
  if (!record) throw AppError.notFound("Company was not found or is protected.");
  return record;
}
