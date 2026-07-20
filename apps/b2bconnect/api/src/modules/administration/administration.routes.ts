import type { FastifyInstance } from "fastify";
import { registerContractRoute } from "@codexsun/framework/http";
import { z } from "zod";
import type { B2bConnectAuthenticationService } from "../authentication/index.js";
import type { B2bConnectAdministrationService } from "./administration.service.js";

const sessionSchema = z.object({
  authenticated: z.literal(true),
  email: z.string(),
  expiresAt: z.string(),
  name: z.string(),
  role: z.enum(["super_admin", "admin", "client"]),
  sessionIssuedAt: z.string()
});

export function registerB2bConnectAdministrationRoutes(
  app: FastifyInstance,
  authentication: B2bConnectAuthenticationService,
  administration: B2bConnectAdministrationService
) {
  registerContractRoute(app, {
    method: "GET",
    url: "/b2bconnect/admin/dashboard",
    schemas: {
      response: z.object({
        accessLabel: z.literal("Administration"),
        capabilities: z.tuple([
          z.literal("Member review"),
          z.literal("Marketplace moderation"),
          z.literal("Enquiry oversight")
        ]),
        session: sessionSchema,
        welcomeMessage: z.string()
      })
    },
    handler: ({ request }) =>
      administration.dashboard(authentication.requireSession(request.headers, "admin"))
  });
}
