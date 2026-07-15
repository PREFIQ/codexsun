import { AppError } from "@codexsun/framework/errors";
import {
  deleteTransformPlanForMapping,
  upsertTransformPlanFromMapping
} from "../transforms/index.js";
import { MappingsTransformsRepository } from "./mappings-transforms.repository.js";
import type { MappingPlan, MappingTable } from "./mappings-transforms.types.js";
import { processMappingQueries } from "./mappings-transforms.worker.js";
export class MappingsTransformsService {
  constructor(private readonly repository = new MappingsTransformsRepository()) {}
  initialize() {
    return this.repository.initialize();
  }
  list() {
    return this.repository.list();
  }
  async get(id: number) {
    const plan = await this.repository.getDetails(id);
    if (!plan) throw AppError.notFound("Field mapping plan was not found.");
    return plan;
  }
  async getContext(id: number) {
    const context = await this.repository.getContext(id);
    if (!context) throw AppError.notFound("Field mapping plan was not found.");
    return context;
  }
  async create(discoverySnapshotId: number, name?: string) {
    const snapshot = await import("../discovery-snapshots/index.js").then((module) =>
      module.getDiscoverySnapshotForMapping(discoverySnapshotId)
    );
    if (!snapshot?.mappingInput)
      throw AppError.validation("Prepare the Discovery snapshot before creating mappings.");
    if (
      (await this.repository.listRaw()).some(
        (plan) => plan.discoverySnapshotId === discoverySnapshotId
      )
    )
      throw AppError.conflict("A mapping plan already exists for this snapshot.");
    return this.repository.create(
      discoverySnapshotId,
      name?.trim() || `Mapping plan #${discoverySnapshotId}`
    );
  }
  async update(id: number, name: string, status: MappingPlan["status"], mappings: MappingTable[]) {
    this.validateMappings(mappings);
    const plan = await this.repository.update(id, name.trim(), status, mappings);
    if (!plan) throw AppError.notFound("Field mapping plan was not found.");
    await upsertTransformPlanFromMapping(id, plan.name, processMappingQueries(mappings));
    return plan;
  }
  async delete(id: number) {
    if (!(await this.repository.delete(id)))
      throw AppError.notFound("Field mapping plan was not found.");
    await deleteTransformPlanForMapping(id);
    return { deleted: true as const, id };
  }
  validateMappings(mappings: MappingTable[]) {
    if (
      !mappings.length ||
      mappings.some(
        (item) =>
          !item.sourceTable ||
          !item.targetTable ||
          !item.fields.some((field) => !field.skipped && field.targetColumn)
      )
    )
      throw AppError.validation(
        "Every mapped table requires Source, Target, and at least one mapped field."
      );
    return mappings;
  }
}
