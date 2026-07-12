import type { FastifyInstance } from "fastify";
import { ok } from "@codexsun/framework/http";
import { resolveAccountsDatabaseName } from "../../database/accounts-database.js";
import { AccountsSettingsService } from "./settings.service.js";
import type { AccountsSettings } from "./settings.types.js";

const service = new AccountsSettingsService();

export async function registerAccountsSettingsRoutes(app: FastifyInstance) {
  app.get("/accounts/settings", async (request) =>
    ok(await service.get(databaseName(request.headers["x-tenant-db"])), { requestId: request.id })
  );
  app.put("/accounts/settings", async (request) =>
    ok(
      await service.save(
        databaseName(request.headers["x-tenant-db"]),
        request.body as AccountsSettings
      ),
      { requestId: request.id }
    )
  );
}

function databaseName(value: string | string[] | undefined) {
  return resolveAccountsDatabaseName(Array.isArray(value) ? value[0] : value);
}
