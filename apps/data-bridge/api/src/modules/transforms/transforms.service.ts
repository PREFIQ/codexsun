import { AppError } from "@codexsun/framework/errors";
import { TransformsRepository } from "./transforms.repository.js";
import type { TransformPlan } from "./transforms.types.js";
export class TransformsService {
  constructor(private readonly repository = new TransformsRepository()) {}
  initialize() {
    return this.repository.initialize();
  }
  list() {
    return this.repository.list();
  }
  async get(id: number) {
    const plan = await this.repository.get(id);
    if (!plan) throw AppError.notFound("Transform plan was not found.");
    return plan;
  }
  async setApproval(id: number, status: TransformPlan["status"]) {
    const plan = await this.repository.get(id);
    if (!plan) throw AppError.notFound("Transform plan was not found.");
    if (
      status === "approved" &&
      (!plan.tables.length || plan.tables.some((table) => !table.fields.length))
    )
      throw AppError.conflict("Every transform table needs mapped fields before approval.");
    return (await this.repository.setApproval(id, status))!;
  }
}
