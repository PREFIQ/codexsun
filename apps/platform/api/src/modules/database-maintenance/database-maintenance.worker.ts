import { DatabaseMaintenanceRepository } from "./database-maintenance.repository.js";

export async function processDatabaseMaintenanceJob(payload: Record<string, unknown>) {
  const runId = Number(payload.runId);
  if (!Number.isInteger(runId) || runId <= 0) {
    throw new Error("Database maintenance job requires a valid runId.");
  }

  const repository = new DatabaseMaintenanceRepository();
  const run = await repository.findRun(runId);
  if (!run) {
    throw new Error("Database maintenance run was not found.");
  }

  const executedAt = new Date().toISOString();
  const executionMode = run.operation === "restore" ? "sandbox-restore-check" : "operator-backup-check";
  const details = {
    ...run.details,
    executedAt,
    executionMode,
    queueStatus: "completed"
  };
  await repository.updateRunStatus(run.id, "completed", details);

  return {
    databaseName: run.databaseName,
    executionMode,
    operation: run.operation,
    runId: run.id,
    scope: run.scope
  };
}
