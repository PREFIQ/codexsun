export function createMigrationAuditEvent(action: string, approvalReference?: string) {
  return { action, approvalReference: approvalReference ?? null, occurredAt: new Date().toISOString(), sensitivePayloadIncluded: false };
}
