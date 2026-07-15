export function createMigrationManagerEvent(jobId: number, action: string, tenant: string) {
  return {
    name: `data-bridge.migration-job.${action}`,
    jobId,
    tenant,
    occurredAt: new Date().toISOString()
  };
}
