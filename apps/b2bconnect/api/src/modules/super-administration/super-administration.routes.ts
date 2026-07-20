import type { FastifyInstance } from "fastify";
import { registerContractRoute } from "@codexsun/framework/http";
import { z } from "zod";
import type { B2bConnectAuthenticationService } from "../authentication/index.js";
import type { B2bConnectSuperAdministrationService } from "./super-administration.service.js";

const sessionSchema = z.object({
  authenticated: z.literal(true),
  email: z.string(),
  expiresAt: z.string(),
  name: z.string(),
  role: z.enum(["super_admin", "admin", "client"]),
  sessionIssuedAt: z.string()
});

export function registerB2bConnectSuperAdministrationRoutes(
  app: FastifyInstance,
  authentication: B2bConnectAuthenticationService,
  superAdministration: B2bConnectSuperAdministrationService
) {
  registerContractRoute(app, {
    method: "GET",
    url: "/b2bconnect/sa/dashboard",
    schemas: {
      response: z.object({
        accessLabel: z.literal("Super administration"),
        capabilities: z.tuple([
          z.literal("Deployment control"),
          z.literal("Access governance"),
          z.literal("Platform health")
        ]),
        session: sessionSchema,
        welcomeMessage: z.string()
      })
    },
    handler: ({ request }) =>
      superAdministration.dashboard(authentication.requireSession(request.headers, "super_admin"))
  });
}
