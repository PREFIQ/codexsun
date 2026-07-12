import type { FastifyInstance } from "fastify";
import { ok } from "@codexsun/framework/http";
import { resolveBillingDatabaseName } from "../../database/billing-database.js";
import { PaymentService } from "./payment.service.js";
import type { PaymentInput, PaymentStatus } from "./payment.types.js";
const service = new PaymentService();
const dbName = (value: string | string[] | undefined) =>
  resolveBillingDatabaseName(Array.isArray(value) ? value[0] : value);
export async function registerPaymentRoutes(app: FastifyInstance) {
  app.get("/billing/payments", async (request) =>
    ok(await service.list(dbName(request.headers["x-tenant-db"])), { requestId: request.id })
  );
  app.get("/billing/payments/:id", async (request, reply) => {
    const record = await service.get(
      dbName(request.headers["x-tenant-db"]),
      (request.params as { id: string }).id
    );
    if (!record)
      return reply
        .code(404)
        .send({
          error: { code: "PAYMENT_NOT_FOUND", message: "Payment was not found." },
          success: false
        });
    return ok(record, { requestId: request.id });
  });
  app.post("/billing/payments", async (request) =>
    ok(await service.create(dbName(request.headers["x-tenant-db"]), request.body as PaymentInput), {
      requestId: request.id
    })
  );
  app.put("/billing/payments/:id", async (request, reply) => {
    const record = await service.update(
      dbName(request.headers["x-tenant-db"]),
      (request.params as { id: string }).id,
      request.body as PaymentInput
    );
    if (!record)
      return reply
        .code(404)
        .send({
          error: { code: "PAYMENT_NOT_FOUND", message: "Payment was not found." },
          success: false
        });
    return ok(record, { requestId: request.id });
  });
  app.post("/billing/payments/:id/status", async (request, reply) => {
    const body = request.body as { status?: PaymentStatus };
    if (!body.status)
      return reply
        .code(400)
        .send({
          error: { code: "INVALID_STATUS", message: "Payment status is required." },
          success: false
        });
    const record = await service.setStatus(
      dbName(request.headers["x-tenant-db"]),
      (request.params as { id: string }).id,
      body.status
    );
    if (!record)
      return reply
        .code(404)
        .send({
          error: { code: "PAYMENT_NOT_FOUND", message: "Payment was not found." },
          success: false
        });
    return ok(record, { requestId: request.id });
  });
  app.delete("/billing/payments/:id", async (request, reply) => {
    const record = await service.deleteDraft(
      dbName(request.headers["x-tenant-db"]),
      (request.params as { id: string }).id
    );
    if (!record)
      return reply
        .code(404)
        .send({
          error: { code: "PAYMENT_NOT_FOUND", message: "Payment was not found." },
          success: false
        });
    return ok(record, { requestId: request.id });
  });
}
