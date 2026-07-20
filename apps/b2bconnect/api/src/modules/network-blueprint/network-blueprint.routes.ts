import type { FastifyInstance } from "fastify";
import { registerContractRoute } from "@codexsun/framework/http";
import { z } from "zod";
import type { NetworkBlueprintService } from "./network-blueprint.service.js";

const blueprintSchema = z.object({
  associations: z.array(z.object({ code: z.string(), description: z.string(), name: z.string() })),
  capabilities: z.array(
    z.object({
      description: z.string(),
      key: z.string(),
      name: z.string(),
      stage: z.enum(["active", "next"])
    })
  ),
  formula: z.array(z.string()),
  positioning: z.object({
    primary: z.string(),
    secondary: z.string(),
    reject: z.array(z.string())
  }),
  roles: z.array(
    z.object({
      responsibilities: z.array(z.string()),
      role: z.enum(["super_admin", "admin", "client"])
    })
  ),
  whatsapp: z.array(z.object({ description: z.string(), name: z.string() }))
});

export function registerNetworkBlueprintRoutes(
  app: FastifyInstance,
  service: NetworkBlueprintService
) {
  registerContractRoute(app, {
    method: "GET",
    url: "/b2bconnect/public/network-blueprint",
    schemas: { response: blueprintSchema },
    handler: () => service.read()
  });
}
