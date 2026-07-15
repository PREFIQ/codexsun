import type { ReconciliationReport } from "./reconciliation-audit.types.js";

export function createReconciliationAuditEvent(report: ReconciliationReport, action: string) {
  return {
    name: `data-bridge.reconciliation.${action}`,
    reportId: report.id,
    runId: report.executionRunId,
    tenant: report.tenant,
    status: report.status,
    occurredAt: new Date().toISOString()
  };
}
