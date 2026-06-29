import { AppError } from "@codexsun/framework/errors";
import type { CoreDefinition, CoreDefinitionKey, CoreRecord, CoreRecordCreate, CoreRecordUpdate } from "./contracts.js";
import { coreDefinitions, defaultSeedRecords } from "./contracts.js";
import type { CoreRecordRepository } from "./repository.js";

export class CoreDefinitionService {
  list(): CoreDefinition[] { return coreDefinitions; }
  get(key: CoreDefinitionKey): CoreDefinition | undefined {
    return coreDefinitions.find((d) => d.definitionKey === key);
  }
}

export class CoreRecordService {
  constructor(private readonly repository: CoreRecordRepository) {}

  async list(tenantId: string, definitionKey?: string): Promise<CoreRecord[]> {
    if (!tenantId) throw AppError.validation("tenantId is required");
    return this.repository.list(tenantId, definitionKey);
  }

  async getById(tenantId: string, recordId: string): Promise<CoreRecord> {
    const record = await this.repository.getById(tenantId, recordId);
    if (!record) throw AppError.notFound("Core record not found");
    return record;
  }

  async create(input: CoreRecordCreate): Promise<CoreRecord> {
    if (!input.tenantId) throw AppError.validation("tenantId is required");
    if (!input.definitionKey) throw AppError.validation("definitionKey is required");
    if (!input.code?.trim()) throw AppError.validation("code is required");
    if (!input.name?.trim()) throw AppError.validation("name is required");
    const existing = await this.repository.getByCode(input.tenantId, input.definitionKey, input.code);
    if (existing) throw AppError.conflict(`Record with code '${input.code}' already exists`);
    const record: CoreRecord = {
      recordId: crypto.randomUUID(),
      tenantId: input.tenantId,
      definitionKey: input.definitionKey,
      code: input.code,
      name: input.name,
      status: "active",
      payload: input.payload ?? {},
      createdBy: input.createdBy,
      createdAt: new Date().toISOString(),
      updatedBy: input.createdBy,
      updatedAt: new Date().toISOString()
    };
    await this.repository.create(record);
    return record;
  }

  async update(input: CoreRecordUpdate): Promise<CoreRecord> {
    const existing = await this.getById(input.tenantId, input.recordId);
    const updated: CoreRecord = {
      ...existing,
      ...(input.name !== undefined ? { name: input.name } : {}),
      ...(input.payload !== undefined ? { payload: input.payload } : {}),
      updatedBy: input.updatedBy,
      updatedAt: new Date().toISOString()
    };
    await this.repository.update(updated);
    return updated;
  }

  async archive(tenantId: string, recordId: string): Promise<void> {
    const existing = await this.getById(tenantId, recordId);
    if (existing.status === "archived") throw AppError.conflict("Record is already archived");
    await this.repository.archive(tenantId, recordId);
  }

  async restore(tenantId: string, recordId: string): Promise<void> {
    const existing = await this.repository.getById(tenantId, recordId);
    if (!existing) throw AppError.notFound("Core record not found");
    if (existing.status === "active") throw AppError.conflict("Record is already active");
    await this.repository.restore(tenantId, recordId);
  }

  async seedDefaults(tenantId: string, createdBy: string): Promise<number> {
    let count = 0;
    for (const seed of defaultSeedRecords) {
      const existing = await this.repository.getByCode(tenantId, seed.definitionKey, seed.code);
      if (!existing) {
        const seedInput: Parameters<typeof this.create>[0] = {
          tenantId, definitionKey: seed.definitionKey,
          code: seed.code, name: seed.name,
          ...(seed.payload !== undefined ? { payload: seed.payload } : {}),
          createdBy
        };
        await this.create(seedInput);
        count++;
      }
    }
    return count;
  }
}
