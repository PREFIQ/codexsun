import { existsSync } from "node:fs";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { randomUUID } from "node:crypto";
import { AppError } from "@codexsun/framework/errors";
import type { Todo, TodoInput, TodoStatus } from "./task-manager.types.js";

const baseDir = process.env.TASK_MANAGER_JSON_DIR ?? join(process.cwd(), "apps/platform/api/task-manager-json");

export class TaskManagerJsonStore {
  async list(tenantKey: string) { return (await this.read(tenantKey)).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)); }
  async get(tenantKey: string, id: string) { return (await this.read(tenantKey)).find(item => item.id === id) ?? null; }
  async create(tenantKey: string, input: TodoInput) { const title = input.title.trim(); if (!title) throw AppError.validation("Todo title is required."); const now = new Date().toISOString(); const record: Todo = { id: `todo-${randomUUID().slice(0, 8)}`, title, description: String(input.description ?? ""), status: input.status ?? "open", priority: input.priority ?? "medium", dueDate: String(input.dueDate ?? ""), createdAt: now, updatedAt: now }; const records = await this.read(tenantKey); records.push(record); await this.write(tenantKey, records); return record; }
  async update(tenantKey: string, id: string, input: Partial<TodoInput>) { const records = await this.read(tenantKey); const current = records.find(item => item.id === id); if (!current) throw AppError.notFound("Todo was not found."); const next = { ...current, ...input, title: String(input.title ?? current.title).trim(), updatedAt: new Date().toISOString() }; if (!next.title) throw AppError.validation("Todo title is required."); await this.write(tenantKey, records.map(item => item.id === id ? next : item)); return next; }
  async setStatus(tenantKey: string, id: string, status: TodoStatus) { const current = await this.get(tenantKey, id); if (!current) throw AppError.notFound("Todo was not found."); return this.update(tenantKey, id, { status, title: current.title }); }
  async delete(tenantKey: string, id: string) { const records = await this.read(tenantKey); if (!records.some(item => item.id === id)) throw AppError.notFound("Todo was not found."); await this.write(tenantKey, records.filter(item => item.id !== id)); return { id, deleted: true }; }
  private async read(tenantKey: string) { const file = fileFor(tenantKey); await ensure(file); return JSON.parse(await readFile(file, "utf8")) as Todo[]; }
  private async write(tenantKey: string, records: Todo[]) { const file = fileFor(tenantKey); await mkdir(baseDir, { recursive: true }); await writeFile(file, JSON.stringify(records, null, 2), "utf8"); }
}
function fileFor(tenantKey: string) { const safe = tenantKey.replace(/[^a-zA-Z0-9_-]/g, "_") || "default"; return join(baseDir, `${safe}-todos.json`); }
async function ensure(file: string) { if (!existsSync(file)) { await mkdir(baseDir, { recursive: true }); await writeFile(file, "[]", "utf8"); } }
