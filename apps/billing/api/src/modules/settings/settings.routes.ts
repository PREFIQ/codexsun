import type { FastifyInstance } from "fastify";
import { ok } from "@codexsun/framework/http";
import { resolveBillingDatabaseName } from "../../database/billing-database.js";
import { BillingSettingsRepository } from "./settings.repository.js";
import type { BillingSettings } from "./settings.types.js";

const repository = new BillingSettingsRepository();

export async function registerBillingSettingsRoutes(app: FastifyInstance) {
  app.get("/billing/settings", async (request) =>
    ok(await repository.getBillingSettings(databaseName(request.headers["x-tenant-db"])), { requestId: request.id }),
  );

  app.put("/billing/settings", async (request) =>
    ok(await repository.saveBillingSettings(databaseName(request.headers["x-tenant-db"]), request.body as BillingSettings), { requestId: request.id }),
  );

  app.get("/billing/settings/sales", async (request) =>
    ok(await repository.getSalesSettings(databaseName(request.headers["x-tenant-db"])), { requestId: request.id }),
  );

  app.put("/billing/settings/sales", async (request) =>
    ok(await repository.saveSalesSettings(databaseName(request.headers["x-tenant-db"]), request.body as BillingSettings), { requestId: request.id }),
  );

  app.get("/billing/document-settings", async (request) => {
    const settings = await repository.getBillingSettings(databaseName(request.headers["x-tenant-db"]));
    return ok(settings.numbering, { requestId: request.id });
  });

  app.put("/billing/document-settings", async (request) => {
    const tenantDatabase = databaseName(request.headers["x-tenant-db"]);
    const settings = await repository.getBillingSettings(tenantDatabase);
    const saved = await repository.saveBillingSettings(tenantDatabase, {
      ...settings,
      numbering: request.body as BillingSettings["numbering"],
    });
    return ok(saved.numbering, { requestId: request.id });
  });
}

function databaseName(value: string | string[] | undefined) {
  return resolveBillingDatabaseName(Array.isArray(value) ? value[0] : value);
}
