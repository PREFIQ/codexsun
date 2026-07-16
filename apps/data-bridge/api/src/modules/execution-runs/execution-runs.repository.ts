import { dataBridgeJsonStore } from "../../data-bridge-json.store.js";
import type {
  ExecutionConflict,
  ExecutionRun,
  StoredExecutionRun
} from "./execution-runs.types.js";

export class ExecutionRunsRepository {
  async initialize() {
    await dataBridgeJsonStore.initialize("executionRuns");
  }

  async list(): Promise<ExecutionRun[]> {
    const runs = (await dataBridgeJsonStore.list(
      "executionRuns"
    )) as unknown as StoredExecutionRun[];
    return runs.map(publicRun);
  }

  async get(id: number): Promise<ExecutionRun | null> {
    const run = await this.getStored(id);
    return run ? publicRun(run) : null;
  }

  async getStored(id: number) {
    return (await dataBridgeJsonStore.get(
      "executionRuns",
      id
    )) as unknown as StoredExecutionRun | null;
  }

  async create(input: Omit<StoredExecutionRun, "id">) {
    const run = (await dataBridgeJsonStore.create(
      "executionRuns",
      input as never
    )) as unknown as StoredExecutionRun;
    return publicRun(run);
  }

  async update(id: number, patch: Partial<StoredExecutionRun>) {
    const run = (await dataBridgeJsonStore.update("executionRuns", id, {
      ...patch,
      updatedAt: new Date().toISOString()
    } as never)) as unknown as StoredExecutionRun | null;
    return run ? publicRun(run) : null;
  }

  async updateStored(id: number, patch: Partial<StoredExecutionRun>) {
    return (await dataBridgeJsonStore.update("executionRuns", id, {
      ...patch,
      updatedAt: new Date().toISOString()
    } as never)) as unknown as StoredExecutionRun | null;
  }

  async ledger(id: number) {
    return (await this.getStored(id))?.ledger ?? [];
  }
}

function publicRun(run: StoredExecutionRun): ExecutionRun {
  const publicFields = { ...run } as Partial<StoredExecutionRun>;
  delete publicFields.ledger;
  delete publicFields.audit;
  delete publicFields.conflicts;
  delete publicFields.selectedRecords;
  return {
    ...(publicFields as ExecutionRun),
    conflicts: run.conflicts.map(publicConflict)
  } as ExecutionRun;
}

function publicConflict(conflict: StoredExecutionRun["conflicts"][number]): ExecutionConflict {
  return {
    id: conflict.id,
    table: conflict.table,
    sourceRecordRef: conflict.sourceRecordRef,
    targetRecordRef: conflict.targetRecordRef,
    status: conflict.status,
    decision: conflict.decision,
    detectedAt: conflict.detectedAt
  };
}
