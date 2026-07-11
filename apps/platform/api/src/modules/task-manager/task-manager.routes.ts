import type { FastifyInstance } from "fastify";
import { ok } from "@codexsun/framework/http";
import { TaskManagerJsonStore } from "./task-manager.store.js";
import { TaskManagerLookupStore } from "./task-manager.lookup-store.js";
import type { TodoInput, TodoLookupKind, TodoStatus } from "./task-manager.types.js";
const store = new TaskManagerJsonStore();
const lookupStore = new TaskManagerLookupStore();
const tenant = (request: { headers: Record<string, string | string[] | undefined> }) => { const value = request.headers["x-tenant-id"]; return Array.isArray(value) ? value[0] ?? "default" : value ?? "default"; };
export async function registerTaskManagerRoutes(app: FastifyInstance) {
  app.get("/task-manager/todos", async request => ok(await store.list(tenant(request)), { requestId: request.id }));
  app.get("/task-manager/lookups", async request => ok(await lookupStore.list(tenant(request)), { requestId: request.id }));
  app.post("/task-manager/lookups", async request => { const body = request.body as { kind: TodoLookupKind; name: string }; return ok(await lookupStore.create(tenant(request), body.kind, body.name), { requestId: request.id }); });
  app.post("/task-manager/todos", async request => ok(await store.create(tenant(request), request.body as TodoInput), { requestId: request.id }));
  app.post("/task-manager/todos/reorder", async request => ok(await store.reorder(tenant(request), (request.body as { orderedIds: string[] }).orderedIds), { requestId: request.id }));
  app.put("/task-manager/todos/:id", async request => ok(await store.update(tenant(request), (request.params as { id: string }).id, request.body as Partial<TodoInput>), { requestId: request.id }));
  app.post("/task-manager/todos/:id/status", async request => ok(await store.setStatus(tenant(request), (request.params as { id: string }).id, (request.body as { status: TodoStatus }).status), { requestId: request.id }));
  app.delete("/task-manager/todos/:id", async request => ok(await store.delete(tenant(request), (request.params as { id: string }).id), { requestId: request.id }));
}
