import { ExecutionRunsService } from "./execution-runs.service.js";

const publicService = new ExecutionRunsService();

export async function getCompletedExecutionRun(id: number) {
  const run = await publicService.get(id);
  return run?.status === "completed" ? run : null;
}

export async function getExecutionLedger(id: number) {
  return publicService.ledger(id);
}

export { registerExecutionRunsModule } from "./execution-runs.module.js";
export type {
  ExecutionConflict,
  ExecutionLedgerEntry,
  ExecutionRun,
  ExecutionRunStatus,
  ExecutionTableProgress
} from "./execution-runs.types.js";
