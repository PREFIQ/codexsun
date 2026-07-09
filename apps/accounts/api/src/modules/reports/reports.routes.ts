import type { FastifyInstance } from "fastify";
import { ok } from "@codexsun/framework/http";
import { resolveAccountsDatabaseName } from "../../database/accounts-database.js";
import { ReportsService } from "./reports.service.js";

const service = new ReportsService();

export async function registerReportsRoutes(app: FastifyInstance) {
  app.get("/accounts/reports", async (request) => ok(await service.overview(databaseName(request.headers["x-tenant-db"])), { requestId: request.id }));
  app.get("/accounts/reports/trial-balance", async (request) => ok(await service.trialBalance(databaseName(request.headers["x-tenant-db"])), { requestId: request.id }));
  app.get("/accounts/reports/ledger-statement/:ledgerId", async (request) => {
    const { ledgerId } = request.params as { ledgerId: string };
    return ok(await service.ledgerStatement(databaseName(request.headers["x-tenant-db"]), ledgerId), { requestId: request.id });
  });
  app.get("/accounts/reports/outstanding", async (request) => ok(await service.outstanding(databaseName(request.headers["x-tenant-db"])), { requestId: request.id }));
  app.get("/accounts/reports/voucher-register", async (request) => ok(await service.voucherRegister(databaseName(request.headers["x-tenant-db"])), { requestId: request.id }));
  app.get("/accounts/reports/gst", async (request) => ok(await service.gstSummary(databaseName(request.headers["x-tenant-db"])), { requestId: request.id }));
}

function databaseName(value: string | string[] | undefined) {
  return resolveAccountsDatabaseName(Array.isArray(value) ? value[0] : value);
}
