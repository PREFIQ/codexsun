import { dataBridgeJsonStore } from "../../data-bridge-json.store.js";
import type { TransformPlan } from "./transforms.types.js";

export class TransformsRepository {
  async initialize() {
    await dataBridgeJsonStore.initialize("transformPlans");
  }

  async list() {
    return (await dataBridgeJsonStore.list("transformPlans")) as unknown as TransformPlan[];
  }

  async get(id: number) {
    return (await dataBridgeJsonStore.get("transformPlans", id)) as unknown as TransformPlan | null;
  }

  async setApproval(id: number, status: TransformPlan["status"]) {
    return (await dataBridgeJsonStore.update("transformPlans", id, {
      status,
      approvedAt: status === "approved" ? new Date().toISOString() : null,
      updatedAt: new Date().toISOString()
    } as never)) as unknown as TransformPlan | null;
  }

  async upsertFromMapping(mappingPlanId: number, name: string, tables: TransformPlan["tables"]) {
    const existing = (await this.list()).find((item) => item.mappingPlanId === mappingPlanId);
    const timestamp = new Date().toISOString();
    const patch = {
      mappingPlanId,
      name: `${name} transforms`,
      status: "draft" as const,
      tables,
      approvedAt: null,
      updatedAt: timestamp
    };
    if (existing)
      return (await dataBridgeJsonStore.update(
        "transformPlans",
        existing.id,
        patch as never
      )) as unknown as TransformPlan;
    return (await dataBridgeJsonStore.create("transformPlans", {
      ...patch,
      createdAt: timestamp
    } as never)) as unknown as TransformPlan;
  }

  async deleteForMapping(mappingPlanId: number) {
    const existing = (await this.list()).find((item) => item.mappingPlanId === mappingPlanId);
    return existing ? dataBridgeJsonStore.delete("transformPlans", existing.id) : false;
  }
}
