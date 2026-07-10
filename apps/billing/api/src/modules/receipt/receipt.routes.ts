import type { FastifyInstance } from "fastify";
import { ok } from "@codexsun/framework/http";
import { resolveBillingDatabaseName } from "../../database/billing-database.js";
import { ReceiptService } from "./receipt.service.js";
import type { ReceiptInput, ReceiptStatus } from "./receipt.types.js";
const service = new ReceiptService(); const dbName = (value: string | string[] | undefined) => resolveBillingDatabaseName(Array.isArray(value) ? value[0] : value);
export async function registerReceiptRoutes(app: FastifyInstance) {
 app.get("/billing/receipts", async (request) => ok(await service.list(dbName(request.headers["x-tenant-db"])), { requestId: request.id }));
 app.get("/billing/receipts/:id", async (request, reply) => { const record = await service.get(dbName(request.headers["x-tenant-db"]), (request.params as { id: string }).id); if (!record) return reply.code(404).send({ error: { code: "RECEIPT_NOT_FOUND", message: "Receipt was not found." }, success: false }); return ok(record, { requestId: request.id }); });
 app.post("/billing/receipts", async (request) => ok(await service.create(dbName(request.headers["x-tenant-db"]), request.body as ReceiptInput), { requestId: request.id }));
 app.put("/billing/receipts/:id", async (request, reply) => { const record = await service.update(dbName(request.headers["x-tenant-db"]), (request.params as { id: string }).id, request.body as ReceiptInput); if (!record) return reply.code(404).send({ error: { code: "RECEIPT_NOT_FOUND", message: "Receipt was not found." }, success: false }); return ok(record, { requestId: request.id }); });
 app.post("/billing/receipts/:id/status", async (request, reply) => { const body = request.body as { status?: ReceiptStatus }; if (!body.status) return reply.code(400).send({ error: { code: "INVALID_STATUS", message: "Receipt status is required." }, success: false }); const record = await service.setStatus(dbName(request.headers["x-tenant-db"]), (request.params as { id: string }).id, body.status); if (!record) return reply.code(404).send({ error: { code: "RECEIPT_NOT_FOUND", message: "Receipt was not found." }, success: false }); return ok(record, { requestId: request.id }); });
 app.delete("/billing/receipts/:id", async (request, reply) => { const record = await service.deleteDraft(dbName(request.headers["x-tenant-db"]), (request.params as { id: string }).id); if (!record) return reply.code(404).send({ error: { code: "RECEIPT_NOT_FOUND", message: "Receipt was not found." }, success: false }); return ok(record, { requestId: request.id }); });
}
