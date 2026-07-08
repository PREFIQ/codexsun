export type DatabaseOperation = "backup" | "migrate" | "refresh" | "restore" | "status";
export type DatabaseRunStatus = "completed" | "failed" | "requested" | "running";

export type DatabaseMigrationRow = {
  appliedAt: string;
  name: string;
};

export type DatabaseMaintenanceRun = {
  completedAt: string | null;
  createdAt: string;
  databaseName: string;
  details: Record<string, unknown>;
  id: number;
  operation: DatabaseOperation;
  scope: "master" | "tenant";
  status: DatabaseRunStatus;
  targetKey: string;
  uuid: string;
};

export type TenantDatabaseStatus = {
  databaseName: string;
  host: string;
  migrations: DatabaseMigrationRow[];
  port: number;
  runs: DatabaseMaintenanceRun[];
  status: "online" | "offline";
  tableCount: number;
  tenantCode: string;
  tenantId: number;
  tenantName: string;
  version: string;
};

export type TenantDatabaseActionPayload = {
  backupId?: string | undefined;
  note?: string | undefined;
  tenantId?: number | undefined;
};
