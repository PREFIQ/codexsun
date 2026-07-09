import { CommonMasterRepository } from "./common-master.repository.js";
import type { CommonMasterDefinition } from "./common-master.types.js";

export class CommonMasterService {
  private readonly repository: CommonMasterRepository;

  constructor(private readonly definition: CommonMasterDefinition) {
    this.repository = new CommonMasterRepository(definition);
  }

  list(tenantId: string) { return this.repository.list(tenantId); }
  find(tenantId: string, id: string) { return this.repository.find(tenantId, id); }
  create(tenantId: string, input: Record<string, unknown>) {
    this.validate(input);
    return this.repository.create(tenantId, input);
  }
  update(tenantId: string, id: string, input: Record<string, unknown>) {
    this.validate(input);
    return this.repository.update(tenantId, id, input);
  }
  activate(tenantId: string, id: string) { return this.repository.setActive(tenantId, id, true); }
  deactivate(tenantId: string, id: string) { return this.repository.setActive(tenantId, id, false); }

  private validate(input: Record<string, unknown>) {
    for (const field of this.definition.fields) {
      if (!field.required) continue;
      const value = input[field.key];
      if (value === undefined || value === null || (typeof value === "string" && !value.trim())) {
        throw new Error(`${field.label} is required.`);
      }
    }
  }
}
