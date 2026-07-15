import { existsSync } from "node:fs";
import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";

export type JsonRecord = Record<string, unknown> & { id: number };
type Registry = {
  migrationJobs: JsonRecord[];
  discoverySnapshots: JsonRecord[];
  mappingPlans: JsonRecord[];
  transformPlans: JsonRecord[];
  reviewApprovals: JsonRecord[];
  executionRuns: JsonRecord[];
  reconciliationReports: JsonRecord[];
};

const repoDir = join(process.cwd(), "apps/data-bridge/api/data-bridge-json");
const dataDir =
  process.env.DATA_BRIDGE_JSON_DIR ??
  (existsSync(repoDir) ? repoDir : join(process.cwd(), "data-bridge-json"));
const files = {
  migrationJobs: "migration-jobs.json",
  discoverySnapshots: "discovery-snapshots.json",
  mappingPlans: "mapping-plans.json",
  transformPlans: "transform-plans.json",
  reviewApprovals: "review-approvals.json",
  executionRuns: "execution-runs.json",
  reconciliationReports: "reconciliation-reports.json"
} as const;
let writeQueue = Promise.resolve();

export class DataBridgeJsonStore {
  async initialize(kind: keyof Registry) {
    await ensureFile(kind);
  }
  async list<K extends keyof Registry>(kind: K): Promise<Registry[K]> {
    return (await readRegistry(kind)).sort((a, b) => b.id - a.id) as Registry[K];
  }
  async get<K extends keyof Registry>(kind: K, id: number): Promise<Registry[K][number] | null> {
    return (await readRegistry(kind)).find((item) => item.id === id) ?? null;
  }
  async create<K extends keyof Registry>(
    kind: K,
    input: Omit<Registry[K][number], "id">
  ): Promise<Registry[K][number]> {
    return this.mutate(kind, (records) => {
      const record = { ...input, id: nextId(records) } as Registry[K][number];
      records.push(record);
      return record;
    });
  }
  async update<K extends keyof Registry>(
    kind: K,
    id: number,
    patch: Partial<Registry[K][number]>
  ): Promise<Registry[K][number] | null> {
    return this.mutate(kind, (records) => {
      const index = records.findIndex((item) => item.id === id);
      if (index < 0) return null;
      const record = { ...records[index], ...patch, id } as Registry[K][number];
      records[index] = record;
      return record;
    });
  }
  async delete<K extends keyof Registry>(kind: K, id: number) {
    return this.mutate(kind, (records) => {
      const index = records.findIndex((item) => item.id === id);
      if (index < 0) return false;
      records.splice(index, 1);
      return true;
    });
  }
  private async mutate<K extends keyof Registry, T>(
    kind: K,
    change: (records: Registry[K]) => T
  ): Promise<T> {
    let result!: T;
    writeQueue = writeQueue.then(async () => {
      const records = await readRegistry(kind);
      result = change(records);
      await writeJson(pathFor(kind), records);
    });
    await writeQueue;
    return result;
  }
}

export const dataBridgeJsonStore = new DataBridgeJsonStore();
async function readRegistry<K extends keyof Registry>(kind: K): Promise<Registry[K]> {
  await ensureFile(kind);
  const value = JSON.parse(await readFile(pathFor(kind), "utf8"));
  return (Array.isArray(value) ? value : []) as Registry[K];
}
async function ensureFile(kind: keyof Registry) {
  await mkdir(dataDir, { recursive: true });
  const path = pathFor(kind);
  try {
    await readFile(path, "utf8");
  } catch (error) {
    if (!isMissing(error)) throw error;
    await writeJson(path, []);
  }
}
async function writeJson(path: string, data: unknown) {
  await mkdir(dirname(path), { recursive: true });
  const temporary = `${path}.${process.pid}.tmp`;
  await writeFile(temporary, `${JSON.stringify(data, null, 2)}\n`, "utf8");
  await rename(temporary, path);
}
function pathFor(kind: keyof Registry) {
  return join(dataDir, files[kind]);
}
function nextId(records: JsonRecord[]) {
  return records.reduce((max, item) => Math.max(max, item.id), 0) + 1;
}
function isMissing(error: unknown) {
  return typeof error === "object" && error !== null && "code" in error && error.code === "ENOENT";
}
