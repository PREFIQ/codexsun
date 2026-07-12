import type { FastifyInstance } from "fastify";
import { ok } from "@codexsun/framework/http";
import { resolveKitchenServeDatabaseName } from "../../database/kitchen-serve-database.js";
import { ServiceOrdersService } from "./service-orders.service.js";
import type { ServiceOrderInput, ServiceOrderStatus } from "./service-orders.types.js";
const service = new ServiceOrdersService();
export async function registerServiceOrdersRoutes(app: FastifyInstance) {
  app.get("/kitchen-serve/orders", async (request) => {
    const ctx = context(request.headers);
    const q = request.query as { status?: ServiceOrderStatus };
    return ok(await service.list(ctx.db, ctx.tenantId, q.status), { requestId: request.id });
  });
  app.post("/kitchen-serve/orders", async (request) => {
    const ctx = context(request.headers);
    return ok(await service.create(ctx.db, ctx.tenantId, request.body as ServiceOrderInput), {
      requestId: request.id
    });
  });
  app.post("/kitchen-serve/orders/:id/transition", async (request, reply) => {
    const ctx = context(request.headers);
    const { id } = request.params as { id: string };
    const { status } = request.body as { status: ServiceOrderStatus };
    const order = await service.transition(ctx.db, ctx.tenantId, id, status);
    if (!order)
      return reply.code(404).send({
        success: false,
        error: { code: "ORDER_NOT_FOUND", message: "Order was not found." }
      });
    return ok(order, { requestId: request.id });
  });
  app.get("/kitchen-serve/bill-waiting", async (request) => {
    const ctx = context(request.headers);
    return ok(await service.list(ctx.db, ctx.tenantId, "bill-waiting"), { requestId: request.id });
  });
}
function context(headers: Record<string, unknown>) {
  const tenantValue = headers["x-tenant-id"];
  const tenantId = Array.isArray(tenantValue) ? tenantValue[0] : tenantValue;
  if (typeof tenantId !== "string" || !tenantId.trim())
    throw new Error("KitchenServe requires x-tenant-id.");
  const dbValue = headers["x-tenant-db"];
  return {
    db: resolveKitchenServeDatabaseName(Array.isArray(dbValue) ? dbValue[0] : dbValue),
    tenantId: tenantId.trim()
  };
}
