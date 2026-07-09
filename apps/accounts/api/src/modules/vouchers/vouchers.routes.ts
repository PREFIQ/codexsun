import type { FastifyInstance } from "fastify";
import { ok } from "@codexsun/framework/http";
import { resolveAccountsDatabaseName } from "../../database/accounts-database.js";
import { VouchersService } from "./vouchers.service.js";
import type { AccountsPostingRequest, VoucherSavePayload } from "./vouchers.types.js";

const service = new VouchersService();

export async function registerVouchersRoutes(app: FastifyInstance) {
  app.get("/accounts/vouchers", async (request) => {
    const query = request.query as { search?: string };
    return ok(await service.list(databaseName(request.headers["x-tenant-db"]), query.search ?? ""), { requestId: request.id });
  });
  app.get("/accounts/vouchers/:id", async (request, reply) => {
    const { id } = request.params as { id: string };
    const voucher = await service.get(databaseName(request.headers["x-tenant-db"]), id);
    if (!voucher) return reply.code(404).send({ error: { code: "VOUCHER_NOT_FOUND", message: "Voucher was not found." }, success: false });
    return ok(voucher, { requestId: request.id });
  });
  app.post("/accounts/vouchers", async (request) => ok(await service.create(databaseName(request.headers["x-tenant-db"]), request.body as VoucherSavePayload), { requestId: request.id }));
  app.post("/accounts/vouchers/:id/cancel", async (request, reply) => {
    const { id } = request.params as { id: string };
    const voucher = await service.cancel(databaseName(request.headers["x-tenant-db"]), id);
    if (!voucher) return reply.code(404).send({ error: { code: "VOUCHER_NOT_FOUND", message: "Voucher was not found." }, success: false });
    return ok(voucher, { requestId: request.id });
  });
  app.post("/accounts/postings/billing", async (request) => ok(await service.postSource(databaseName(request.headers["x-tenant-db"]), request.body as AccountsPostingRequest), { requestId: request.id }));
}

function databaseName(value: string | string[] | undefined) {
  return resolveAccountsDatabaseName(Array.isArray(value) ? value[0] : value);
}
