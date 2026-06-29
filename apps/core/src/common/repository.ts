import type { CoreRecord } from "./contracts.js";

export interface CoreRecordRepository {
  list(tenantId: string, definitionKey?: string): Promise<CoreRecord[]>;
  getById(tenantId: string, recordId: string): Promise<CoreRecord | null>;
  getByCode(tenantId: string, definitionKey: string, code: string): Promise<CoreRecord | null>;
  create(record: CoreRecord): Promise<void>;
  update(record: CoreRecord): Promise<void>;
  archive(tenantId: string, recordId: string): Promise<void>;
  restore(tenantId: string, recordId: string): Promise<void>;
}

export class InMemoryCoreRecordRepository implements CoreRecordRepository {
  private records: CoreRecord[] = [];

  async list(tenantId: string, definitionKey?: string): Promise<CoreRecord[]> {
    return this.records.filter((r) => {
      if (r.tenantId !== tenantId) return false;
      if (definitionKey && r.definitionKey !== definitionKey) return false;
      if (r.deletedAt) return false;
      return true;
    }).sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  }

  async getById(tenantId: string, recordId: string): Promise<CoreRecord | null> {
    return this.records.find((r) => r.recordId === recordId && r.tenantId === tenantId) ?? null;
  }

  async getByCode(tenantId: string, definitionKey: string, code: string): Promise<CoreRecord | null> {
    return this.records.find((r) => r.tenantId === tenantId && r.definitionKey === definitionKey && r.code === code && !r.deletedAt) ?? null;
  }

  async create(record: CoreRecord): Promise<void> {
    this.records.push(record);
  }

  async update(record: CoreRecord): Promise<void> {
    const idx = this.records.findIndex((r) => r.recordId === record.recordId && r.tenantId === record.tenantId);
    if (idx !== -1) this.records[idx] = record;
  }

  async archive(tenantId: string, recordId: string): Promise<void> {
    const record = await this.getById(tenantId, recordId);
    if (record) {
      record.status = "archived";
      record.deletedAt = new Date().toISOString();
    }
  }

  async restore(tenantId: string, recordId: string): Promise<void> {
    const record = this.records.find((r) => r.recordId === recordId && r.tenantId === tenantId);
    if (record) {
      record.status = "active";
      delete (record as { deletedAt?: unknown }).deletedAt;
    }
  }
}
