import type { FastifyInstance } from "fastify";
import { registerContractRoute } from "@codexsun/framework/http";
import { z } from "zod";
import type { B2bConnectAuthenticationService } from "../authentication/index.js";
import type { B2bConnectClientPortalService } from "./client-portal.service.js";

const sessionSchema = z.object({
  authenticated: z.literal(true),
  email: z.string(),
  expiresAt: z.string(),
  name: z.string(),
  role: z.enum(["super_admin", "admin", "client"]),
  sessionIssuedAt: z.string()
});

export function registerB2bConnectClientPortalRoutes(
  app: FastifyInstance,
  authentication: B2bConnectAuthenticationService,
  clientPortal: B2bConnectClientPortalService
) {
  registerContractRoute(app, {
    method: "GET",
    url: "/b2bconnect/app/dashboard",
    schemas: {
      response: z.object({
        accessLabel: z.literal("Client portal"),
        capabilities: z.tuple([
          z.literal("Business profile"),
          z.literal("Marketplace discovery"),
          z.literal("Direct enquiries")
        ]),
        session: sessionSchema,
        welcomeMessage: z.string()
      })
    },
    handler: ({ request }) =>
      clientPortal.dashboard(authentication.requireSession(request.headers, "client"))
  });
}
