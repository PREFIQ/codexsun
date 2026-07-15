import { dataBridgeJsonStore } from "../../data-bridge-json.store.js";
import type { ReviewApproval } from "./review-approvals.types.js";

export class ReviewApprovalsRepository {
  async initialize() {
    await dataBridgeJsonStore.initialize("reviewApprovals");
  }

  async list() {
    return (await dataBridgeJsonStore.list("reviewApprovals")) as unknown as ReviewApproval[];
  }

  async get(id: number) {
    return (await dataBridgeJsonStore.get(
      "reviewApprovals",
      id
    )) as unknown as ReviewApproval | null;
  }

  async findByTransformPlan(transformPlanId: number) {
    return (await this.list()).find((item) => item.transformPlanId === transformPlanId) ?? null;
  }

  async create(input: Omit<ReviewApproval, "id">) {
    return (await dataBridgeJsonStore.create(
      "reviewApprovals",
      input as never
    )) as unknown as ReviewApproval;
  }

  async update(id: number, patch: Partial<ReviewApproval>) {
    return (await dataBridgeJsonStore.update(
      "reviewApprovals",
      id,
      patch as never
    )) as unknown as ReviewApproval | null;
  }
}
