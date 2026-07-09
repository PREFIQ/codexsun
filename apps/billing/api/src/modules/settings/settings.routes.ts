import type { FastifyInstance } from "fastify";
import { ok } from "@codexsun/framework/http";
import { resolveBillingDatabaseName } from "../../database/billing-database.js";
import { BillingSettingsRepository } from "./settings.repository.js";
import type { BillingSalesSettings } from "./settings.types.js";

const repository = new BillingSettingsRepository();

export async function registerBillingSettingsRoutes(app: FastifyInstance) {
  app.get("/billing/settings/sales", async (request) =>
    ok(await repository.getSalesSettings(databaseName(request.headers["x-tenant-db"])), { requestId: request.id }),
  );

  app.put("/billing/settings/sales", async (request) =>
    ok(await repository.saveSalesSettings(databaseName(request.headers["x-tenant-db"]), request.body as BillingSalesSettings), { requestId: request.id }),
  );
}

function databaseName(value: string | string[] | undefined) {
  return resolveBillingDatabaseName(Array.isArray(value) ? value[0] : value);
}
