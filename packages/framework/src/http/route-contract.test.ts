import Fastify from "fastify";
import { describe, expect, it } from "vitest";
import { registerContractRoute } from "./route-contract.js";
import { z } from "zod";

describe("registerContractRoute", () => {
  it("parses input and wraps only schema-valid output", async () => {
    const app = Fastify();
    registerContractRoute(app, {
      method: "POST",
      url: "/items/:id",
      schemas: {
        body: z.object({ label: z.string().min(1) }).strict(),
        params: z.object({ id: z.coerce.number().int().positive() }).strict(),
        response: z.object({ id: z.number().int(), label: z.string() }).strict()
      },
      handler: ({ body, params }) => ({ id: params.id, label: body.label })
    });

    const response = await app.inject({ method: "POST", url: "/items/7", payload: { label: "Platform" } });
    expect(response.statusCode).toBe(200);
    expect(response.json()).toMatchObject({ success: true, data: { id: 7, label: "Platform" } });
  });

  it("returns the framework validation envelope for invalid input", async () => {
    const app = Fastify();
    app.setErrorHandler((error, _request, reply) => reply.code((error as { statusCode?: number }).statusCode ?? 500).send(error));
    registerContractRoute(app, {
      method: "POST",
      url: "/items",
      schemas: { body: z.object({ label: z.string().min(1) }).strict(), response: z.object({ label: z.string() }) },
      handler: ({ body }) => body
    });

    const response = await app.inject({ method: "POST", url: "/items", payload: { label: "" } });
    expect(response.statusCode).toBe(400);
    expect(response.json()).toMatchObject({ code: "VALIDATION_ERROR" });
  });
});
