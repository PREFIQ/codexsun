import { dataBridgeJsonStore } from "../../data-bridge-json.store.js";
import type { SchemaTable, TableDifference } from "./discovery-snapshots.types.js";
type Snapshot = Record<string, unknown> & {
  id: number;
  migrationJobId: number;
  source: SchemaTable[];
  target: SchemaTable[];
  comparison: TableDifference[];
  omittedTables: string[];
  tableMappings: Record<string, string>;
  tableGroups: Record<string, string>;
  mappingInput: unknown | null;
  preparedAt: string | null;
  sourceTableCount: number;
  targetTableCount: number;
  differenceCount: number;
  createdAt: string;
};
export class DiscoverySnapshotsRepository {
  async initialize() {
    await dataBridgeJsonStore.initialize("discoverySnapshots");
  }
  async create(
    jobId: number,
    source: SchemaTable[],
    target: SchemaTable[],
    comparison: TableDifference[]
  ) {
    const record = await dataBridgeJsonStore.create("discoverySnapshots", {
      migrationJobId: jobId,
      source,
      target,
      comparison,
      omittedTables: [],
      tableMappings: {},
      tableGroups: {},
      mappingInput: null,
      preparedAt: null,
      sourceTableCount: source.length,
      targetTableCount: target.length,
      differenceCount: comparison.filter((item) => item.status !== "match").length,
      createdAt: new Date().toISOString()
    } as never);
    return this.get(record.id);
  }
  async list() {
    const records = (await dataBridgeJsonStore.list("discoverySnapshots")) as unknown as Snapshot[];
    return Promise.all(records.map((record) => this.summary(record)));
  }
  async get(id: number) {
    const record = (await dataBridgeJsonStore.get(
      "discoverySnapshots",
      id
    )) as unknown as Snapshot | null;
    if (!record) return null;
    return {
      ...(await this.summary(record)),
      source: record.source,
      target: record.target,
      comparison: record.comparison,
      omittedTables: record.omittedTables ?? [],
      tableMappings: record.tableMappings ?? {},
      tableGroups: record.tableGroups ?? {},
      mappingInput: record.mappingInput ?? null,
      preparedAt: record.preparedAt ?? null
    };
  }
  async setOmittedTables(id: number, tables: string[]) {
    const snapshot = await this.get(id);
    if (!snapshot) return null;
    const differenceCount = snapshot.comparison.filter(
      (item: TableDifference) => item.status !== "match" && !tables.includes(item.table)
    ).length;
    await dataBridgeJsonStore.update("discoverySnapshots", id, {
      omittedTables: tables,
      differenceCount
    } as never);
    return this.get(id);
  }
  async setTableMappings(id: number, mappings: Record<string, string>) {
    await dataBridgeJsonStore.update("discoverySnapshots", id, {
      tableMappings: mappings,
      mappingInput: null,
      preparedAt: null
    } as never);
    return this.get(id);
  }
  async setTableGroups(id: number, groups: Record<string, string>) {
    await dataBridgeJsonStore.update("discoverySnapshots", id, {
      tableGroups: groups,
      mappingInput: null,
      preparedAt: null
    } as never);
    return this.get(id);
  }
  async delete(id: number) {
    const plans = await dataBridgeJsonStore.list("mappingPlans");
    for (const plan of plans) {
      if (Number(plan.discoverySnapshotId) === id)
        await dataBridgeJsonStore.delete("mappingPlans", plan.id);
    }
    return dataBridgeJsonStore.delete("discoverySnapshots", id);
  }
  async prepareMappingInput(id: number) {
    const snapshot = await this.get(id);
    if (!snapshot) return null;
    const selected = Object.entries(snapshot.tableMappings)
      .filter(([, target]) => !snapshot.omittedTables.includes(target))
      .map(([sourceName, targetName]) => {
        const difference = snapshot.comparison.find(
          (item: TableDifference) => item.table === sourceName || item.table === targetName
        );
        return {
          table: sourceName,
          targetTable: targetName,
          group: snapshot.tableGroups[targetName] ?? "",
          status: difference?.status ?? "different",
          differences: difference?.differences ?? [],
          source: snapshot.source.find((table: SchemaTable) => table.name === sourceName) ?? null,
          target: snapshot.target.find((table: SchemaTable) => table.name === targetName) ?? null
        };
      });
    const mappingInput = {
      version: 1,
      snapshotId: snapshot.id,
      migrationJobId: snapshot.migrationJobId,
      jobName: snapshot.jobName,
      direction: "source-to-target",
      selectedTableCount: selected.length,
      omittedTables: snapshot.omittedTables,
      tableMappings: snapshot.tableMappings,
      tableGroups: snapshot.tableGroups,
      tables: selected
    };
    const preparedAt = new Date().toISOString();
    await dataBridgeJsonStore.update("discoverySnapshots", id, {
      mappingInput,
      preparedAt
    } as never);
    const mappings = selected.flatMap((entry) =>
      entry.source && entry.target
        ? [
            {
              sourceTable: entry.source.name,
              targetTable: entry.target.name,
              group: entry.group,
              fields: entry.source.columns.map((column) => ({
                sourceColumn: column.name,
                targetColumn:
                  entry.target?.columns.find((targetColumn) => targetColumn.name === column.name)
                    ?.name ?? ""
              }))
            }
          ]
        : []
    );
    const plans = await dataBridgeJsonStore.list("mappingPlans");
    const existing = plans.find((plan) => Number(plan.discoverySnapshotId) === id);
    if (existing) {
      await dataBridgeJsonStore.update("mappingPlans", existing.id, {
        name: String(existing.name || `${snapshot.jobName} mapping`),
        status: "draft",
        mappings,
        updatedAt: preparedAt
      } as never);
    } else {
      await dataBridgeJsonStore.create("mappingPlans", {
        discoverySnapshotId: id,
        name: `${snapshot.jobName} mapping`,
        status: "draft",
        mappings,
        createdAt: preparedAt,
        updatedAt: preparedAt
      } as never);
    }
    return this.get(id);
  }
  private async summary(record: Snapshot) {
    const job = await dataBridgeJsonStore.get("migrationJobs", record.migrationJobId);
    return {
      id: record.id,
      migrationJobId: record.migrationJobId,
      jobName: String(job?.name ?? "Unknown job"),
      sourceDatabase: String((job?.source as Record<string, unknown> | undefined)?.database ?? ""),
      targetDatabase: String((job?.target as Record<string, unknown> | undefined)?.database ?? ""),
      sourceTableCount: Number(record.sourceTableCount ?? record.source.length),
      targetTableCount: Number(record.targetTableCount ?? record.target.length),
      differenceCount: Number(record.differenceCount ?? 0),
      preparedAt: record.preparedAt ?? null,
      createdAt: record.createdAt
    };
  }
}
