import { dataBridgeJsonStore } from "../../data-bridge-json.store.js";
import type { ReconciliationReport } from "./reconciliation-audit.types.js";

export class ReconciliationAuditRepository {
  async initialize() {
    await dataBridgeJsonStore.initialize("reconciliationReports");
  }

  async list() {
    return (await dataBridgeJsonStore.list(
      "reconciliationReports"
    )) as unknown as ReconciliationReport[];
  }

  async get(id: number) {
    return (await dataBridgeJsonStore.get(
      "reconciliationReports",
      id
    )) as unknown as ReconciliationReport | null;
  }

  async findByRun(executionRunId: number) {
    return (await this.list()).find((report) => report.executionRunId === executionRunId) ?? null;
  }

  async create(input: Omit<ReconciliationReport, "id">) {
    return (await dataBridgeJsonStore.create(
      "reconciliationReports",
      input as never
    )) as unknown as ReconciliationReport;
  }

  async update(id: number, patch: Partial<ReconciliationReport>) {
    return (await dataBridgeJsonStore.update("reconciliationReports", id, {
      ...patch,
      updatedAt: new Date().toISOString()
    } as never)) as unknown as ReconciliationReport | null;
  }
}
