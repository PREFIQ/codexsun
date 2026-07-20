import type { FastifyInstance } from "fastify";
import { registerContractRoute } from "@codexsun/framework/http";
import { z } from "zod";
import type { EcommerceAppInfo } from "./app-info.types.js";

const appInfoSchema = z.object({
  appId: z.literal("ecommerce"),
  brandName: z.string(),
  businessModel: z.literal("multi-vendor-ecommerce"),
  moduleBoundary: z.object({
    current: z.tuple([z.literal("app-info")]),
    planned: z.tuple([
      z.literal("vendors"),
      z.literal("catalog"),
      z.literal("cart"),
      z.literal("orders"),
      z.literal("fulfilment")
    ])
  }),
  purpose: z.string(),
  stack: z.object({
    foundation: z.tuple([
      z.literal("framework"),
      z.literal("platform"),
      z.literal("core"),
      z.literal("billing")
    ]),
    owner: z.literal("ecommerce")
  }),
  status: z.literal("scaffold"),
  tagline: z.string()
});

export async function registerEcommerceAppInfoRoutes(
  app: FastifyInstance,
  appInfo: EcommerceAppInfo
) {
  registerContractRoute(app, {
    method: "GET",
    url: "/ecommerce/app-info",
    schemas: { response: appInfoSchema },
    handler: () => appInfo
  });
}
