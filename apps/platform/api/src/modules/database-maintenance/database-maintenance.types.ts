export type DatabaseScope = "master" | "tenant";
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
  scope: DatabaseScope;
  status: DatabaseRunStatus;
  targetKey: string;
  uuid: string;
};

export type MasterDatabaseStatus = {
  backupStatus: "operator-required" | "verified";
  databaseName: string;
  host: string;
  migrations: DatabaseMigrationRow[];
  port: number;
  restoreStatus: "not-configured" | "sandbox-configured";
  runs: DatabaseMaintenanceRun[];
  status: "online" | "offline";
  tableCount: number;
  version: string;
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

export type DatabaseActionPayload = {
  backupId?: string;
  note?: string;
  tenantId?: number;
};
