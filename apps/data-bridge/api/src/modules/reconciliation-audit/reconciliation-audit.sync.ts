export function reconciliationAuditSyncDecision() {
  return { direction: "server-only", conflictPolicy: "signed-report-is-immutable", offline: false };
}
