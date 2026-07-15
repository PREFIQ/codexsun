import type { ExecutionRun } from "./execution-runs.types.js";

export function createExecutionRunEvent(run: ExecutionRun, action: string) {
  return {
    name: `data-bridge.execution.${action}`,
    runId: run.id,
    tenant: run.tenant,
    status: run.status,
    occurredAt: new Date().toISOString()
  };
}
