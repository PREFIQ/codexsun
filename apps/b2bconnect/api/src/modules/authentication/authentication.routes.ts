import type { FastifyInstance } from "fastify";
import { registerContractRoute } from "@codexsun/framework/http";
import { z } from "zod";
import type { B2bConnectAuthenticationService } from "./authentication.service.js";

const roleSchema = z.enum(["super_admin", "admin", "client"]);
const sessionSchema = z.object({
  authenticated: z.literal(true),
  email: z.string(),
  expiresAt: z.string(),
  name: z.string(),
  role: roleSchema,
  sessionIssuedAt: z.string()
});

export function registerB2bConnectAuthenticationRoutes(
  app: FastifyInstance,
  authentication: B2bConnectAuthenticationService
) {
  registerContractRoute(app, {
    method: "GET",
    url: "/b2bconnect/auth/session",
    schemas: { response: sessionSchema },
    handler: ({ request }) => authentication.requireSession(request.headers)
  });

  registerContractRoute(app, {
    method: "POST",
    url: "/b2bconnect/auth/logout",
    schemas: { response: z.object({ loggedOut: z.literal(true) }) },
    handler: ({ request }) => {
      authentication.requireSession(request.headers);
      return { loggedOut: true } as const;
    }
  });
}
