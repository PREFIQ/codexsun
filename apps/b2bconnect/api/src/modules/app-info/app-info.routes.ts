import type { FastifyInstance } from "fastify";
import { registerContractRoute } from "@codexsun/framework/http";
import { z } from "zod";
import type { B2bConnectAppInfo } from "./app-info.types.js";

const appInfoSchema = z.object({
  appId: z.literal("b2bconnect"),
  brandName: z.string(),
  businessModel: z.literal("b2b-marketplace"),
  moduleBoundary: z.object({
    current: z.tuple([
      z.literal("app-info"),
      z.literal("authentication"),
      z.literal("business-profile"),
      z.literal("client-portal"),
      z.literal("network-blueprint"),
      z.literal("administration"),
      z.literal("super-administration")
    ]),
    planned: z.tuple([
      z.literal("leads"),
      z.literal("rfq"),
      z.literal("capacity-exchange"),
      z.literal("networking"),
      z.literal("jobs"),
      z.literal("events"),
      z.literal("finance"),
      z.literal("export-intelligence")
    ])
  }),
  purpose: z.string(),
  stack: z.object({
    foundation: z.tuple([z.literal("framework"), z.literal("platform"), z.literal("core")]),
    owner: z.literal("b2bconnect")
  }),
  status: z.literal("foundation"),
  tagline: z.string()
});

export async function registerB2bConnectAppInfoRoutes(
  app: FastifyInstance,
  appInfo: B2bConnectAppInfo
) {
  registerContractRoute(app, {
    method: "GET",
    url: "/b2bconnect/app-info",
    schemas: { response: appInfoSchema },
    handler: () => appInfo
  });
}
