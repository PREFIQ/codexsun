import { createMasterDatabase, migratePlatformDatabase, platformDatabaseName } from "../../database/platform-database.js";
import { createTenantDatabase, getTenantDatabase, closeTenantDatabase } from "../../database/tenant-database.js";
import { migrateTenantRuntimeModule } from "../tenant/tenant.migration.js";
import { PlatformActivityService } from "../platform-activity/index.js";
import { QueueManagerService } from "../queue-manager/index.js";
import { DatabaseMaintenanceRepository } from "./database-maintenance.repository.js";
import type { DatabaseActionPayload } from "./database-maintenance.types.js";

export class DatabaseMaintenanceService {
  constructor(
    private readonly repository = new DatabaseMaintenanceRepository(),
    private readonly activity = new PlatformActivityService(),
    private readonly queue = new QueueManagerService()
  ) {}

  masterStatus() {
    return this.repository.masterStatus();
  }

  tenantStatuses() {
    return this.repository.tenantStatuses();
  }

  async migrateMaster(input: DatabaseActionPayload = {}) {
    await this.repository.recordRun({ databaseName: platformDatabaseName(), details: input, operation: "migrate", scope: "master", status: "running", targetKey: "master" });
    await createMasterDatabase();
    await migratePlatformDatabase();
    const run = await this.repository.recordRun({ databaseName: platformDatabaseName(), details: input, operation: "migrate", scope: "master", status: "completed", targetKey: "master" });
    await this.activity.recordActivity({ action: "database.master.migrated", details: input, moduleKey: "platform.database-maintenance", recordLabel: platformDatabaseName() });
    return run;
  }

  async migrateTenant(tenantId: number, input: DatabaseActionPayload = {}) {
    const tenant = await this.repository.findTenant(tenantId);
    if (!tenant) return null;
    await this.repository.recordRun({ databaseName: tenant.dbName, details: input, operation: "migrate", scope: "tenant", status: "running", targetKey: String(tenant.id) });
    await createTenantDatabase(tenant.dbName);
    const database = getTenantDatabase(tenant);
    try {
      await migrateTenantRuntimeModule(database);
    } finally {
      await closeTenantDatabase(tenant);
    }
    const run = await this.repository.recordRun({ databaseName: tenant.dbName, details: input, operation: "migrate", scope: "tenant", status: "completed", targetKey: String(tenant.id) });
    await this.activity.recordActivity({ action: "database.tenant.migrated", details: input, moduleKey: "platform.database-maintenance", recordId: tenant.id, recordLabel: tenant.tenantCode, recordUuid: tenant.uuid });
    return run;
  }

  async requestMasterBackup(input: DatabaseActionPayload = {}) {
    const run = await this.repository.recordRun({ databaseName: platformDatabaseName(), details: { ...input, policy: "operator-backup-required" }, operation: "backup", scope: "master", status: "requested", targetKey: "master" });
    if (run) await this.enqueueMaintenanceRun(run.id, "master", null);
    await this.activity.recordActivity({ action: "database.master.backup-requested", details: input, moduleKey: "platform.database-maintenance", recordLabel: platformDatabaseName() });
    return run;
  }

  async requestTenantBackup(tenantId: number, input: DatabaseActionPayload = {}) {
    const tenant = await this.repository.findTenant(tenantId);
    if (!tenant) return null;
    const run = await this.repository.recordRun({ databaseName: tenant.dbName, details: { ...input, policy: "operator-backup-required" }, operation: "backup", scope: "tenant", status: "requested", targetKey: String(tenant.id) });
    if (run) await this.enqueueMaintenanceRun(run.id, "tenant", tenant.id);
    await this.activity.recordActivity({ action: "database.tenant.backup-requested", details: input, moduleKey: "platform.database-maintenance", recordId: tenant.id, recordLabel: tenant.tenantCode, recordUuid: tenant.uuid });
    return run;
  }

  async requestMasterRestore(input: DatabaseActionPayload = {}) {
    const run = await this.repository.recordRun({ databaseName: platformDatabaseName(), details: { ...input, policy: "sandbox-restore-required" }, operation: "restore", scope: "master", status: "requested", targetKey: "master" });
    if (run) await this.enqueueMaintenanceRun(run.id, "master", null);
    await this.activity.recordActivity({ action: "database.master.restore-requested", details: input, moduleKey: "platform.database-maintenance", recordLabel: platformDatabaseName() });
    return run;
  }

  async requestTenantRestore(tenantId: number, input: DatabaseActionPayload = {}) {
    const tenant = await this.repository.findTenant(tenantId);
    if (!tenant) return null;
    const run = await this.repository.recordRun({ databaseName: tenant.dbName, details: { ...input, policy: "sandbox-restore-required" }, operation: "restore", scope: "tenant", status: "requested", targetKey: String(tenant.id) });
    if (run) await this.enqueueMaintenanceRun(run.id, "tenant", tenant.id);
    await this.activity.recordActivity({ action: "database.tenant.restore-requested", details: input, moduleKey: "platform.database-maintenance", recordId: tenant.id, recordLabel: tenant.tenantCode, recordUuid: tenant.uuid });
    return run;
  }

  private enqueueMaintenanceRun(runId: number, scope: "master" | "tenant", tenantId: number | null) {
    return this.queue.enqueue({
      correlationId: `database-maintenance:${runId}`,
      idempotencyKey: `database-maintenance:${runId}`,
      jobName: "database-maintenance.run",
      maxAttempts: 3,
      payload: { runId, scope },
      queueName: "maintenance",
      sourceModule: "platform.database-maintenance",
      tenantId: tenantId ? String(tenantId) : null
    });
  }
}
