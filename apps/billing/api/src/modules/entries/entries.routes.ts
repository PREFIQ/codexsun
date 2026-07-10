import type { FastifyInstance } from "fastify";
import { ok } from "@codexsun/framework/http";
import { resolveEntriesTenantId } from "./entries.context.js";
import { EntriesService } from "./entries.service.js";
import type { EntryKind } from "./entries.types.js";

const service = new EntriesService();

function entryCollectionPath(kind: EntryKind) {
  if (kind === "sales") return "sales";
  if (kind === "purchase") return "purchases";
  return "export-sales";
}

export async function registerEntriesRoutes(app: FastifyInstance) {
  app.get("/billing/entries/support/contacts", async (request) => ok(await service.listContacts(resolveEntriesTenantId(request)), { requestId: request.id }));
  app.post("/billing/entries/support/contacts", async (request) => ok(await service.createContact(resolveEntriesTenantId(request), request.body as Record<string, unknown>), { requestId: request.id }));
  app.put("/billing/entries/support/contacts/:id", async (request) => {
    const { id } = request.params as { id: string };
    return ok(await service.updateContact(resolveEntriesTenantId(request), id, request.body as Record<string, unknown>), { requestId: request.id });
  });

  app.get("/billing/entries/support/products", async (request) => ok(await service.listProducts(resolveEntriesTenantId(request)), { requestId: request.id }));
  app.post("/billing/entries/support/products", async (request) => ok(await service.createProduct(resolveEntriesTenantId(request), request.body as Record<string, unknown>), { requestId: request.id }));
  app.put("/billing/entries/support/products/:id", async (request) => {
    const { id } = request.params as { id: string };
    return ok(await service.updateProduct(resolveEntriesTenantId(request), id, request.body as Record<string, unknown>), { requestId: request.id });
  });

  for (const kind of ["sales", "purchase", "exportSales"] as const satisfies EntryKind[]) {
    const path = entryCollectionPath(kind);
    app.get(`/billing/entries/${path}`, async (request) => ok(await service.listEntries(kind, resolveEntriesTenantId(request), request.query as Record<string, string>), { requestId: request.id }));
    app.get(`/billing/entries/${path}/:id`, async (request) => {
      const { id } = request.params as { id: string };
      return ok(await service.findEntry(kind, resolveEntriesTenantId(request), id), { requestId: request.id });
    });
    app.post(`/billing/entries/${path}`, async (request) => ok(await service.createEntry(kind, resolveEntriesTenantId(request), request.body as Record<string, unknown>), { requestId: request.id }));
    app.put(`/billing/entries/${path}/:id`, async (request) => {
      const { id } = request.params as { id: string };
      return ok(await service.updateEntry(kind, resolveEntriesTenantId(request), id, request.body as Record<string, unknown>), { requestId: request.id });
    });
    app.post(`/billing/entries/${path}/:id/activate`, async (request) => {
      const { id } = request.params as { id: string };
      return ok(await service.setEntryActive(kind, resolveEntriesTenantId(request), id, true), { requestId: request.id });
    });
    app.post(`/billing/entries/${path}/:id/deactivate`, async (request) => {
      const { id } = request.params as { id: string };
      return ok(await service.setEntryActive(kind, resolveEntriesTenantId(request), id, false), { requestId: request.id });
    });
    app.post(`/billing/entries/${path}/:id/comments`, async (request) => {
      const { id } = request.params as { id: string };
      return ok(await service.addComment(kind, resolveEntriesTenantId(request), id, request.body as Record<string, unknown>), { requestId: request.id });
    });
  }

}
