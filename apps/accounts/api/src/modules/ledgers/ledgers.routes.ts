import type { FastifyInstance } from "fastify";
import { ok } from "@codexsun/framework/http";
import { resolveAccountsDatabaseName } from "../../database/accounts-database.js";
import { LedgersService } from "./ledgers.service.js";
import type { LedgerSavePayload } from "./ledgers.types.js";

const service = new LedgersService();

export async function registerLedgersRoutes(app: FastifyInstance) {
  app.get("/accounts/groups", async (request) =>
    ok(await service.groups(databaseName(request.headers["x-tenant-db"])), {
      requestId: request.id
    })
  );
  app.get("/accounts/ledgers", async (request) => {
    const query = request.query as { search?: string };
    return ok(
      await service.list(databaseName(request.headers["x-tenant-db"]), query.search ?? ""),
      { requestId: request.id }
    );
  });
  app.get("/accounts/ledgers/lookup", async (request) =>
    ok(await service.lookup(databaseName(request.headers["x-tenant-db"])), {
      requestId: request.id
    })
  );
  app.get("/accounts/ledgers/:id", async (request, reply) => {
    const { id } = request.params as { id: string };
    const ledger = await service.get(databaseName(request.headers["x-tenant-db"]), id);
    if (!ledger)
      return reply
        .code(404)
        .send({
          error: { code: "LEDGER_NOT_FOUND", message: "Ledger was not found." },
          success: false
        });
    return ok(ledger, { requestId: request.id });
  });
  app.post("/accounts/ledgers", async (request) =>
    ok(
      await service.create(
        databaseName(request.headers["x-tenant-db"]),
        request.body as LedgerSavePayload
      ),
      { requestId: request.id }
    )
  );
  app.put("/accounts/ledgers/:id", async (request, reply) => {
    const { id } = request.params as { id: string };
    const ledger = await service.update(
      databaseName(request.headers["x-tenant-db"]),
      id,
      request.body as LedgerSavePayload
    );
    if (!ledger)
      return reply
        .code(404)
        .send({
          error: { code: "LEDGER_NOT_FOUND", message: "Ledger was not found." },
          success: false
        });
    return ok(ledger, { requestId: request.id });
  });
}

function databaseName(value: string | string[] | undefined) {
  return resolveAccountsDatabaseName(Array.isArray(value) ? value[0] : value);
}
