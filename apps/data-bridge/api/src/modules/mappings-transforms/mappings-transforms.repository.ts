import { dataBridgeJsonStore } from "../../data-bridge-json.store.js";
import { getDiscoverySnapshotForMapping } from "../discovery-snapshots/index.js";
import type { MappingPlan, MappingPlanContext, MappingTable } from "./mappings-transforms.types.js";

export class MappingsTransformsRepository {
  async initialize() {
    await dataBridgeJsonStore.initialize("mappingPlans");
  }
  async listRaw() {
    return (await dataBridgeJsonStore.list("mappingPlans")) as unknown as MappingPlan[];
  }
  async list() {
    return Promise.all(
      (await this.listRaw()).map(async (plan) => {
        const snapshot = await getDiscoverySnapshotForMapping(plan.discoverySnapshotId);
        return {
          ...plan,
          migrationJobId: Number(snapshot?.migrationJobId ?? 0),
          jobName: String(snapshot?.jobName ?? "")
        };
      })
    );
  }
  async getContext(id: number): Promise<MappingPlanContext | null> {
    const plan = (await dataBridgeJsonStore.get(
      "mappingPlans",
      id
    )) as unknown as MappingPlan | null;
    if (!plan) return null;
    const snapshot = await getDiscoverySnapshotForMapping(plan.discoverySnapshotId);
    return snapshot
      ? {
          plan,
          snapshot: {
            id: snapshot.id,
            migrationJobId: snapshot.migrationJobId,
            jobName: snapshot.jobName,
            source: snapshot.source,
            target: snapshot.target,
            mappingInput: snapshot.mappingInput
          }
        }
      : null;
  }
  async getDetails(id: number) {
    const context = await this.getContext(id);
    if (!context) return null;
    return {
      ...context.plan,
      jobName: String(context.snapshot.jobName ?? ""),
      mappingInput: context.snapshot.mappingInput ?? null,
      sourceTables: context.snapshot.source ?? [],
      targetTables: context.snapshot.target ?? []
    };
  }
  async create(discoverySnapshotId: number, name: string) {
    const timestamp = new Date().toISOString();
    return (await dataBridgeJsonStore.create("mappingPlans", {
      discoverySnapshotId,
      name,
      status: "draft",
      mappings: [],
      createdAt: timestamp,
      updatedAt: timestamp
    } as never)) as unknown as MappingPlan;
  }
  async update(id: number, name: string, status: MappingPlan["status"], mappings: MappingTable[]) {
    return (await dataBridgeJsonStore.update("mappingPlans", id, {
      name,
      status,
      mappings,
      updatedAt: new Date().toISOString()
    } as never)) as unknown as MappingPlan | null;
  }
  delete(id: number) {
    return dataBridgeJsonStore.delete("mappingPlans", id);
  }
}
