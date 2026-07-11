import { existsSync } from "node:fs";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { AppError } from "@codexsun/framework/errors";
import type {
  ProjectManagerKind,
  ProjectManagerRecord,
  ProjectManagerRegistryGroup,
  ProjectManagerRegistryModule,
  ProjectManagerRegistryPlatform,
  ProjectManagerRegistryResult,
  ProjectManagerRegistrySavePayload,
  ProjectManagerSavePayload,
  ProjectManagerResult
} from "./project-manager.types.js";

const kinds: ProjectManagerKind[] = ["issue", "task", "review", "kanban", "todo", "timeline", "activity", "discussion", "release"];

const fileNames: Record<ProjectManagerKind, string> = {
  activity: "activity-registry.json",
  discussion: "discussion-registry.json",
  issue: "issue-board.json",
  kanban: "kanban-board.json",
  release: "release-registry.json",
  review: "review-registry.json",
  task: "task-registry.json",
  timeline: "timeline-registry.json",
  todo: "todo-registry.json"
};

const registryFiles = {
  groups: "module-groups.json",
  modules: "module-registry.json",
  platforms: "platform-registry.json",
  result: "platform-registry-result.json"
};

const repoRelativeDatabaseDir = join(process.cwd(), "apps/platform/api/project-manager-json");
const databaseDir = process.env.PROJECT_MANAGER_JSON_DIR ?? (existsSync(repoRelativeDatabaseDir) ? repoRelativeDatabaseDir : join(process.cwd(), "project-manager-json"));

export class ProjectManagerJsonStore {
  async list(kind: ProjectManagerKind) {
    assertKind(kind);
    return (await readRecords(kind)).sort(byOrder);
  }

  async create(kind: ProjectManagerKind, input: ProjectManagerSavePayload) {
    assertKind(kind);
    const records = await readRecords(kind);
    const key = required(input.key, "key");
    if (records.some((record) => same(record.key, key))) {
      throw AppError.conflict(`${kind} key already exists.`);
    }
    const record = normalizeRecord(kind, { ...input, id: nextId(kind), key, createdAt: now(), updatedAt: now() });
    records.push(record);
    await writeRecords(kind, records);
    await this.writeResult();
    return record;
  }

  async update(kind: ProjectManagerKind, id: string, input: Partial<ProjectManagerSavePayload>) {
    assertKind(kind);
    const records = await readRecords(kind);
    const current = records.find((record) => record.id === id);
    if (!current) throw AppError.notFound(`${kind} record was not found.`);
    const next = normalizeRecord(kind, { ...current, ...defined(input), id, updatedAt: now() });
    if (records.some((record) => record.id !== id && same(record.key, next.key))) {
      throw AppError.conflict(`${kind} key already exists.`);
    }
    await writeRecords(kind, records.map((record) => (record.id === id ? next : record)));
    await this.writeResult();
    return next;
  }

  async setActive(kind: ProjectManagerKind, id: string, active: boolean) {
    return this.update(kind, id, { active });
  }

  async delete(kind: ProjectManagerKind, id: string) {
    assertKind(kind);
    const records = await readRecords(kind);
    const current = records.find((record) => record.id === id);
    if (!current) throw AppError.notFound(`${kind} record was not found.`);
    await writeRecords(kind, records.filter((record) => record.id !== id));
    await this.writeResult();
    return { deleted: true, id, title: current.title };
  }

  async result(): Promise<ProjectManagerResult> {
    await ensureFiles();
    const records = Object.fromEntries(await Promise.all(kinds.map(async (kind) => [kind, await this.list(kind)]))) as Record<ProjectManagerKind, ProjectManagerRecord[]>;
    const all = Object.values(records).flat();
    return {
      generatedAt: now(),
      records,
      summary: {
        active: all.filter((record) => record.active).length,
        blocked: all.filter((record) => ["blocked", "critical", "needs-review"].includes(record.status) || record.priority === "critical").length,
        completed: all.filter((record) => ["completed", "done", "released", "approved"].includes(record.status)).length,
        total: all.length
      }
    };
  }

  async writeResult() {
    const result = await this.result();
    await writeJson(join(databaseDir, "project-manager-result.json"), result);
    return result;
  }

  async registryResult(): Promise<ProjectManagerRegistryResult> {
    await ensureRegistryFiles();
    const platforms = (await readRegistryPlatforms()).sort(byRegistryOrder);
    const groups = (await readRegistryGroups()).sort(byRegistryOrder);
    const modules = (await readRegistryModules()).sort(byRegistryOrder);
    const result = {
      generatedAt: now(),
      platforms: platforms.map((platform) => ({
        ...platform,
        groups: groupTree(groups, modules, platform.id, "")
      })),
      summary: {
        activeGroups: groups.filter((group) => group.active).length,
        activeModules: modules.filter((module) => module.active).length,
        platforms: platforms.length,
        totalGroups: groups.length,
        totalModules: modules.length
      }
    };
    await writeJson(join(databaseDir, registryFiles.result), result);
    return result;
  }

  async listRegistryPlatforms() {
    await ensureRegistryFiles();
    return (await readRegistryPlatforms()).sort(byRegistryOrder);
  }

  async listRegistryGroups() {
    await ensureRegistryFiles();
    return (await readRegistryGroups()).sort(byRegistryOrder);
  }

  async listRegistryModules() {
    await ensureRegistryFiles();
    return (await readRegistryModules()).sort(byRegistryOrder);
  }

  async createRegistryPlatform(input: ProjectManagerRegistrySavePayload) {
    const platforms = await readRegistryPlatforms();
    const record = normalizePlatform({ ...input, id: nextId("platform"), createdAt: now(), updatedAt: now() });
    ensureUniqueKey(platforms, record.key, "Platform key already exists.");
    await writeRegistryPlatforms([...platforms, record]);
    await this.registryResult();
    return record;
  }

  async updateRegistryPlatform(id: string, input: Partial<ProjectManagerRegistrySavePayload>) {
    const platforms = await readRegistryPlatforms();
    const current = platforms.find((platform) => platform.id === id);
    if (!current) throw AppError.notFound("Platform registry record was not found.");
    const next = normalizePlatform({ ...current, ...defined(input), id, updatedAt: now() });
    ensureUniqueKey(platforms.filter((platform) => platform.id !== id), next.key, "Platform key already exists.");
    await writeRegistryPlatforms(platforms.map((platform) => (platform.id === id ? next : platform)));
    await this.registryResult();
    return next;
  }

  async createRegistryGroup(input: ProjectManagerRegistrySavePayload) {
    const groups = await readRegistryGroups();
    const record = normalizeGroup({ ...input, id: nextId("group"), createdAt: now(), updatedAt: now() });
    ensureUniqueKey(groups, record.key, "Module group key already exists.");
    await writeRegistryGroups([...groups, record]);
    await this.registryResult();
    return record;
  }

  async updateRegistryGroup(id: string, input: Partial<ProjectManagerRegistrySavePayload>) {
    const groups = await readRegistryGroups();
    const current = groups.find((group) => group.id === id);
    if (!current) throw AppError.notFound("Module group record was not found.");
    const next = normalizeGroup({ ...current, ...defined(input), id, updatedAt: now() });
    ensureUniqueKey(groups.filter((group) => group.id !== id), next.key, "Module group key already exists.");
    await writeRegistryGroups(groups.map((group) => (group.id === id ? next : group)));
    await this.registryResult();
    return next;
  }

  async createRegistryModule(input: ProjectManagerRegistrySavePayload) {
    const modules = await readRegistryModules();
    const record = normalizeModule({ ...input, id: nextId("module"), createdAt: now(), updatedAt: now() });
    ensureUniqueKey(modules, record.key, "Module key already exists.");
    await writeRegistryModules([...modules, record]);
    await this.registryResult();
    return record;
  }

  async updateRegistryModule(id: string, input: Partial<ProjectManagerRegistrySavePayload>) {
    const modules = await readRegistryModules();
    const current = modules.find((module) => module.id === id);
    if (!current) throw AppError.notFound("Module registry record was not found.");
    const next = normalizeModule({ ...current, ...defined(input), id, updatedAt: now() });
    ensureUniqueKey(modules.filter((module) => module.id !== id), next.key, "Module key already exists.");
    await writeRegistryModules(modules.map((module) => (module.id === id ? next : module)));
    await this.registryResult();
    return next;
  }

  async setRegistryActive(kind: "groups" | "modules" | "platforms", id: string, active: boolean) {
    if (kind === "platforms") return this.updateRegistryPlatform(id, { active });
    if (kind === "groups") return this.updateRegistryGroup(id, { active });
    return this.updateRegistryModule(id, { active });
  }
}

async function readRecords(kind: ProjectManagerKind) {
  await ensureFiles();
  const filePath = fileForKind(kind);
  return (await readJson<ProjectManagerRecord[]>(filePath)).map((record) => normalizeRecord(kind, record));
}

async function writeRecords(kind: ProjectManagerKind, records: ProjectManagerRecord[]) {
  await writeJson(fileForKind(kind), records.sort(byOrder));
}

async function ensureFiles() {
  await mkdir(databaseDir, { recursive: true });
  await Promise.all(kinds.map((kind) => ensureJson(fileForKind(kind), seedRecords(kind))));
}

async function ensureJson(filePath: string, fallback: ProjectManagerRecord[]) {
  try {
    await readFile(filePath, "utf8");
  } catch (error) {
    if (!isMissingFile(error)) throw error;
    await writeJson(filePath, fallback);
  }
}

async function ensureRegistryFiles() {
  await mkdir(databaseDir, { recursive: true });
  await Promise.all([
    ensureRegistryJson(join(databaseDir, registryFiles.platforms), seedPlatforms()),
    ensureRegistryJson(join(databaseDir, registryFiles.groups), seedGroups()),
    ensureRegistryJson(join(databaseDir, registryFiles.modules), seedModules())
  ]);
}

async function ensureRegistryJson<T>(filePath: string, fallback: T[]) {
  try {
    await readFile(filePath, "utf8");
  } catch (error) {
    if (!isMissingFile(error)) throw error;
    await writeJson(filePath, fallback);
  }
}

async function readJson<T>(filePath: string): Promise<T> {
  return JSON.parse(await readFile(filePath, "utf8")) as T;
}

async function writeJson(filePath: string, data: unknown) {
  await mkdir(dirname(filePath), { recursive: true });
  await writeFile(filePath, `${JSON.stringify(data, null, 2)}\n`, "utf8");
}

function fileForKind(kind: ProjectManagerKind) {
  return join(databaseDir, fileNames[kind]);
}

function normalizeRecord(kind: ProjectManagerKind, input: Partial<ProjectManagerRecord>): ProjectManagerRecord {
  const timestamp = now();
  return {
    active: input.active ?? true,
    assignee: input.assignee ?? "",
    createdAt: input.createdAt ?? timestamp,
    description: input.description ?? "",
    dueDate: input.dueDate ?? "",
    id: required(input.id, "id"),
    key: required(input.key, "key"),
    kind,
    lane: input.lane ?? defaultLane(kind),
    moduleKey: input.moduleKey ?? "project-manager",
    priority: input.priority ?? "medium",
    referenceId: input.referenceId ?? "",
    referenceType: input.referenceType ?? "",
    sortOrder: Number(input.sortOrder ?? 0),
    status: input.status ?? defaultStatus(kind),
    title: required(input.title, "title"),
    type: input.type ?? kind,
    updatedAt: input.updatedAt ?? timestamp
  };
}

function normalizePlatform(input: Partial<ProjectManagerRegistryPlatform> & ProjectManagerRegistrySavePayload): ProjectManagerRegistryPlatform {
  const timestamp = now();
  return {
    active: input.active ?? true,
    createdAt: input.createdAt ?? timestamp,
    description: input.description ?? "",
    id: required(input.id, "id"),
    key: required(input.key, "key"),
    name: required(input.name, "name"),
    sortOrder: Number(input.sortOrder ?? 0),
    status: input.status ?? "active",
    updatedAt: input.updatedAt ?? timestamp
  };
}

function normalizeGroup(input: Partial<ProjectManagerRegistryGroup> & ProjectManagerRegistrySavePayload): ProjectManagerRegistryGroup {
  const timestamp = now();
  return {
    active: input.active ?? true,
    createdAt: input.createdAt ?? timestamp,
    description: input.description ?? "",
    id: required(input.id, "id"),
    key: required(input.key, "key"),
    name: required(input.name, "name"),
    parentGroupId: input.parentGroupId ?? "",
    platformId: required(input.platformId, "platformId"),
    sortOrder: Number(input.sortOrder ?? 0),
    status: input.status ?? "active",
    updatedAt: input.updatedAt ?? timestamp
  };
}

function normalizeModule(input: Partial<ProjectManagerRegistryModule> & ProjectManagerRegistrySavePayload): ProjectManagerRegistryModule {
  const timestamp = now();
  return {
    active: input.active ?? true,
    createdAt: input.createdAt ?? timestamp,
    description: input.description ?? "",
    groupId: required(input.groupId, "groupId"),
    id: required(input.id, "id"),
    key: required(input.key, "key"),
    moduleType: input.moduleType ?? "module",
    name: required(input.name, "name"),
    parentModuleId: input.parentModuleId ?? "",
    routePath: input.routePath ?? "",
    sortOrder: Number(input.sortOrder ?? 0),
    status: input.status ?? "active",
    updatedAt: input.updatedAt ?? timestamp
  };
}

function seedRecords(kind: ProjectManagerKind) {
  const seedMap = {
    activity: [{ key: "activity.project-manager.started", title: "Project Manager JSON workspace started", status: "active", type: "system" }],
    discussion: [{ key: "discussion.project-manager.workflow", title: "Project Manager workflow discussion", status: "open", type: "architecture" }],
    issue: [{ key: "issue.project-manager.install", title: "Install Project Manager JSON workspace", priority: "high", status: "in-progress", type: "enhancement" }],
    kanban: [{ key: "kanban.project-manager.current", title: "Project Manager current work", lane: "In Progress", status: "active", type: "workflow" }],
    release: [{ key: "release.project-manager.json", title: "Project Manager JSON foundation", status: "planned", type: "release" }],
    review: [{ key: "review.project-manager.ui", title: "Review Project Manager Super Admin UI", status: "requested", type: "ui-review" }],
    task: [{ key: "task.project-manager.json", title: "Build writable JSON project manager", assignee: "Platform", priority: "high", referenceId: "issue.project-manager.install", referenceType: "issue", status: "assigned", type: "implementation" }],
    timeline: [{ key: "timeline.project-manager.started", title: "Project Manager work started", status: "active", type: "milestone" }],
    todo: [{ key: "todo.project-manager.refine", title: "Refine project manager views after first use", status: "open", type: "todo" }]
  } satisfies Record<ProjectManagerKind, Array<Partial<ProjectManagerRecord>>>;
  const rows = seedMap[kind];
  return rows.map((row, index) => normalizeRecord(kind, { ...row, id: `${kind}-seed-${index + 1}`, sortOrder: (index + 1) * 10 }));
}

function seedPlatforms() {
  return [
    normalizePlatform({ description: "Super-admin application registry and operations.", id: "platform-super-admin", key: "platform.super-admin", name: "SUPER ADMIN", sortOrder: 10 }),
    normalizePlatform({ description: "Internal admin workspace modules and operational tools.", id: "platform-admin", key: "platform.admin", name: "ADMIN", sortOrder: 20 }),
    normalizePlatform({ description: "Tenant application modules and tenant-owned feature map.", id: "platform-tenant", key: "platform.tenant", name: "TENANT", sortOrder: 30 })
  ];
}

function seedGroups() {
  const groups: Array<Partial<ProjectManagerRegistryGroup> & ProjectManagerRegistrySavePayload> = [
    { id: "group-sa-project-manager", key: "sa.project-manager", name: "Project Manager", platformId: "platform-super-admin", sortOrder: 10 },
    { id: "group-sa-tenant-setup", key: "sa.tenant-setup", name: "Tenant Setup", platformId: "platform-super-admin", sortOrder: 20 },
    { id: "group-sa-commercial", key: "sa.commercial", name: "Commercial", platformId: "platform-super-admin", sortOrder: 30 },
    { id: "group-sa-catalog", key: "sa.catalog", name: "Catalog", platformId: "platform-super-admin", sortOrder: 40 },
    { id: "group-sa-governance", key: "sa.governance", name: "Governance", platformId: "platform-super-admin", sortOrder: 50 },
    { id: "group-sa-database", key: "sa.database", name: "Database", platformId: "platform-super-admin", sortOrder: 60 },
    { id: "group-sa-design-system", key: "sa.design-system", name: "Design System", platformId: "platform-super-admin", sortOrder: 70 },
    { id: "group-tenant-apps", key: "tenant.apps", name: "Apps", platformId: "platform-tenant", sortOrder: 10 }
  ];
  return groups.map(normalizeGroup);
}

function seedModules() {
  const modules: Array<Partial<ProjectManagerRegistryModule> & ProjectManagerRegistrySavePayload> = [
    ...moduleRows("group-sa-tenant-setup", [["tenants", "Tenants"], ["tenant-domains", "Domains"], ["tenant-access", "Tenant Access"]], "/sa/"),
    ...moduleRows("group-sa-commercial", [["plans", "Plans"], ["plan-access", "Plan Access"], ["subscriptions", "Subscriptions"]], "/sa/"),
    ...moduleRows("group-sa-catalog", [["apps", "Apps"], ["industries", "Industries"]], "/sa/"),
    ...moduleRows("group-sa-governance", [["entitlements", "Entitlements"], ["access-control", "Access Control"], ["platform-activity", "Activity"]], "/sa/"),
    ...moduleRows("group-sa-database", [["master-database", "Master Database"], ["tenant-database", "Tenant Databases"], ["queue-management", "Queue Management"], ["storage-manager", "Storage Manager"]], "/sa/"),
    ...moduleRows("group-sa-project-manager", [["platform-registry", "Platform Registry"], ["work-automation", "Work Automation"]], "/sa/"),
    ...moduleRows("group-sa-design-system", [["design-system", "Components"]], "/sa/"),
    { groupId: "group-tenant-apps", id: "module-app-application", key: "tenant.apps.application", moduleType: "area", name: "Application", routePath: "/app/application/overview", sortOrder: 10 },
    { groupId: "group-tenant-apps", id: "module-app-billing", key: "tenant.apps.billing", moduleType: "area", name: "Billing", routePath: "/app/billing/overview", sortOrder: 20 },
    { groupId: "group-tenant-apps", id: "module-app-accounts", key: "tenant.apps.accounts", moduleType: "area", name: "Accounts", routePath: "/app/accounts/overview", sortOrder: 30 },
    { groupId: "group-tenant-apps", id: "module-app-task-manager", key: "tenant.apps.task-manager", moduleType: "area", name: "Task Manager", routePath: "/app/task-manager/overview", sortOrder: 40 },
    { groupId: "group-tenant-apps", id: "module-application-platform", key: "tenant.apps.application.platform", moduleType: "area", name: "Platform", parentModuleId: "module-app-application", sortOrder: 10 },
    { groupId: "group-tenant-apps", id: "module-application-organisation", key: "tenant.apps.application.organisation", moduleType: "area", name: "Organisation", parentModuleId: "module-app-application", sortOrder: 20 },
    { groupId: "group-tenant-apps", id: "module-platform-landing-desk", key: "tenant.apps.application.platform.landing-desk", name: "Landing Desk", parentModuleId: "module-application-platform", sortOrder: 10 },
    { groupId: "group-tenant-apps", id: "module-platform-profile", key: "tenant.apps.application.platform.profile", name: "Profile", parentModuleId: "module-application-platform", sortOrder: 20 },
    { groupId: "group-tenant-apps", id: "module-platform-setting", key: "tenant.apps.application.platform.setting", name: "Setting", parentModuleId: "module-application-platform", sortOrder: 30 },
    { groupId: "group-tenant-apps", id: "module-organisation-company", key: "tenant.apps.application.organisation.company", name: "Company", parentModuleId: "module-application-organisation", sortOrder: 10 }
  ];
  return modules.map(normalizeModule);
}

function moduleRows(groupId: string, items: Array<[string, string]>, prefix: string) {
  return items.map(([key, name], index) => ({
    groupId,
    id: `module-${key}`,
    key: `sa.${key}`,
    name,
    routePath: `${prefix}${key}`,
    sortOrder: (index + 1) * 10
  }));
}

function assertKind(kind: string): asserts kind is ProjectManagerKind {
  if (!kinds.includes(kind as ProjectManagerKind)) {
    throw AppError.validation("Unsupported project manager kind.");
  }
}

function defaultLane(kind: ProjectManagerKind) {
  return kind === "kanban" ? "Backlog" : "";
}

function defaultStatus(kind: ProjectManagerKind) {
  if (kind === "issue" || kind === "discussion" || kind === "todo") return "open";
  if (kind === "review") return "requested";
  if (kind === "release") return "planned";
  return "active";
}

function required(value: unknown, fieldName: string) {
  if (typeof value !== "string" || !value.trim()) throw AppError.validation(`${fieldName} is required.`);
  return value.trim();
}

function defined<T extends Record<string, unknown>>(input: T): Partial<T> {
  return Object.fromEntries(Object.entries(input).filter(([, value]) => value !== undefined)) as Partial<T>;
}

async function readRegistryPlatforms() {
  return (await readJson<ProjectManagerRegistryPlatform[]>(join(databaseDir, registryFiles.platforms))).map((record) => normalizePlatform(record));
}

async function readRegistryGroups() {
  return (await readJson<ProjectManagerRegistryGroup[]>(join(databaseDir, registryFiles.groups))).map((record) => normalizeGroup(record));
}

async function readRegistryModules() {
  return (await readJson<ProjectManagerRegistryModule[]>(join(databaseDir, registryFiles.modules))).map((record) => normalizeModule(record));
}

async function writeRegistryPlatforms(records: ProjectManagerRegistryPlatform[]) {
  await writeJson(join(databaseDir, registryFiles.platforms), records.sort(byRegistryOrder));
}

async function writeRegistryGroups(records: ProjectManagerRegistryGroup[]) {
  await writeJson(join(databaseDir, registryFiles.groups), records.sort(byRegistryOrder));
}

async function writeRegistryModules(records: ProjectManagerRegistryModule[]) {
  await writeJson(join(databaseDir, registryFiles.modules), records.sort(byRegistryOrder));
}

function groupTree(groups: ProjectManagerRegistryGroup[], modules: ProjectManagerRegistryModule[], platformId: string, parentGroupId: string): ProjectManagerRegistryResult["platforms"][number]["groups"] {
  return groups
    .filter((group) => group.platformId === platformId && group.parentGroupId === parentGroupId)
    .sort(byRegistryOrder)
    .map((group) => ({
      ...group,
      modules: moduleTree(modules, group.id, ""),
      subGroups: groupTree(groups, modules, platformId, group.id)
    }));
}

function moduleTree(modules: ProjectManagerRegistryModule[], groupId: string, parentModuleId: string): ProjectManagerRegistryResult["platforms"][number]["groups"][number]["modules"] {
  return modules
    .filter((module) => module.groupId === groupId && module.parentModuleId === parentModuleId)
    .sort(byRegistryOrder)
    .map((module) => ({ ...module, children: moduleTree(modules, groupId, module.id) }));
}

function ensureUniqueKey(records: Array<{ key: string }>, key: string, message: string) {
  if (records.some((record) => same(record.key, key))) throw AppError.conflict(message);
}

function nextId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function now() {
  return new Date().toISOString();
}

function same(left: string, right: string) {
  return left.trim().toLowerCase() === right.trim().toLowerCase();
}

function byOrder(left: ProjectManagerRecord, right: ProjectManagerRecord) {
  return Number(left.sortOrder) - Number(right.sortOrder) || String(right.updatedAt).localeCompare(String(left.updatedAt));
}

function byRegistryOrder(left: { sortOrder: number; updatedAt: string }, right: { sortOrder: number; updatedAt: string }) {
  return Number(left.sortOrder) - Number(right.sortOrder) || String(right.updatedAt).localeCompare(String(left.updatedAt));
}

function isMissingFile(error: unknown) {
  return typeof error === "object" && error !== null && "code" in error && error.code === "ENOENT";
}
