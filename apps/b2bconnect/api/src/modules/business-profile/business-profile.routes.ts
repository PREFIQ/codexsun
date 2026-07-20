import type { FastifyInstance } from "fastify";
import { registerContractRoute } from "@codexsun/framework/http";
import { z } from "zod";
import type { B2bConnectAuthenticationService } from "../authentication/index.js";
import type { BusinessProfileService } from "./business-profile.service.js";

const associationSchema = z.enum([
  "teama",
  "taef",
  "export-association",
  "industrial-association",
  "independent"
]);
const statusSchema = z.enum(["draft", "pending", "approved", "rejected"]);
const profileSchema = z.object({
  association: associationSchema,
  businessName: z.string(),
  capacityNote: z.string(),
  capabilities: z.array(z.string()),
  createdAt: z.string(),
  description: z.string(),
  industrySegment: z.string(),
  ownerEmail: z.string(),
  productsServices: z.string(),
  publishedAt: z.string().nullable(),
  reviewNote: z.string(),
  status: statusSchema,
  updatedAt: z.string(),
  uuid: z.string(),
  whatsappEnabled: z.boolean(),
  whatsappNumber: z.string()
});
const publicProfileSchema = profileSchema.omit({ ownerEmail: true, reviewNote: true });
const saveSchema = z
  .object({
    association: associationSchema,
    businessName: z.string().trim().min(2).max(160),
    capacityNote: z.string().trim().max(500),
    capabilities: z.array(z.string().trim().min(1).max(80)).max(12),
    description: z.string().trim().min(20).max(1200),
    industrySegment: z.string().trim().min(2).max(120),
    productsServices: z.string().trim().min(2).max(700),
    whatsappEnabled: z.boolean(),
    whatsappNumber: z.string().trim().max(30)
  })
  .strict()
  .refine((value) => !value.whatsappEnabled || value.whatsappNumber.length >= 8, {
    message: "WhatsApp number is required when WhatsApp enquiries are enabled.",
    path: ["whatsappNumber"]
  });

export function registerBusinessProfileRoutes(
  app: FastifyInstance,
  authentication: B2bConnectAuthenticationService,
  profiles: BusinessProfileService
) {
  registerContractRoute(app, {
    method: "GET",
    url: "/b2bconnect/app/profile",
    schemas: { response: profileSchema.nullable() },
    handler: ({ request }) =>
      profiles.ownProfile(authentication.requireSession(request.headers, "client"))
  });
  registerContractRoute(app, {
    method: "PUT",
    url: "/b2bconnect/app/profile",
    schemas: { body: saveSchema, response: profileSchema },
    handler: ({ body, request }) =>
      profiles.saveOwnProfile(authentication.requireSession(request.headers, "client"), body)
  });
  registerContractRoute(app, {
    method: "GET",
    url: "/b2bconnect/admin/profiles",
    schemas: { response: z.array(profileSchema) },
    handler: ({ request }) => {
      authentication.requireSession(request.headers, "admin");
      return profiles.administrationProfiles();
    }
  });
  registerContractRoute(app, {
    method: "PATCH",
    url: "/b2bconnect/admin/profiles/:uuid/review",
    schemas: {
      params: z.object({ uuid: z.string().regex(/^[a-f0-9]{8}$/u) }),
      body: z
        .object({ decision: z.enum(["approve", "reject"]), note: z.string().max(500) })
        .strict(),
      response: profileSchema
    },
    handler: ({ body, params, request }) =>
      profiles.reviewProfile(
        authentication.requireSession(request.headers, "admin"),
        params.uuid,
        body
      )
  });
  registerContractRoute(app, {
    method: "GET",
    url: "/b2bconnect/sa/profiles",
    schemas: { response: z.array(profileSchema) },
    handler: ({ request }) => {
      authentication.requireSession(request.headers, "super_admin");
      return profiles.superAdministrationProfiles();
    }
  });
  registerContractRoute(app, {
    method: "GET",
    url: "/b2bconnect/public/profiles",
    schemas: { response: z.array(publicProfileSchema) },
    handler: () => profiles.publicProfiles()
  });
}
