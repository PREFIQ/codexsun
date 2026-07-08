import type { ColumnType, Generated } from "kysely";
import type { PlatformAppId } from "../modules/app-registry/app-registry.types.js";
import type { TenantStatus } from "../modules/tenant/tenant.types.js";

export type TimestampColumn = ColumnType<Date, Date | string | undefined, Date | string | undefined>;

export type PlatformDatabase = {
  codexsun_migrations: PlatformMigrationsTable;
  platform_apps: PlatformAppsTable;
  tenant_domains: TenantDomainsTable;
  tenant_audit_events: TenantAuditEventsTable;
  tenants: TenantsTable;
};

export type TenantDatabase = {
  tenant_migrations: TenantMigrationsTable;
  tenant_module_settings: TenantModuleSettingsTable;
  tenant_users: TenantUsersTable;
};

export type PlatformAppsTable = {
  always_enabled: boolean | number;
  created_at: TimestampColumn;
  default_landing: boolean | number;
  description: string;
  id: PlatformAppId;
  label: string;
  module_key: string;
  stack: "platform" | "billing";
  updated_at: TimestampColumn;
};

export type PlatformMigrationsTable = {
  applied_at: TimestampColumn;
  id: Generated<number>;
  name: string;
};

export type TenantsTable = {
  corporate_id: string | null;
  created_at: TimestampColumn;
  db_host: string;
  db_name: string;
  db_port: number;
  db_secret_ref: string;
  db_type: string;
  db_user: string;
  default_landing_app: PlatformAppId;
  enabled_module_keys: string;
  id: ColumnType<string | number, string | undefined, string | undefined>;
  mobile: string | null;
  payload_settings: string;
  public_id: string | null;
  slug: string;
  status: TenantStatus;
  tenant_code: string;
  tenant_name: string;
  updated_at: TimestampColumn;
};

export type TenantAuditEventsTable = {
  actor_email: string;
  created_at: TimestampColumn;
  event_name: string;
  id: Generated<number>;
  tenant_id: string;
};

export type TenantDomainsTable = {
  created_at: TimestampColumn;
  domain: string;
  id: Generated<number>;
  is_primary: boolean | number;
  tenant_id: string;
};

export type TenantMigrationsTable = {
  applied_at: TimestampColumn;
  id: Generated<number>;
  name: string;
};

export type TenantModuleSettingsTable = {
  created_at: TimestampColumn;
  enabled: boolean | number;
  id: Generated<number>;
  module_key: string;
  settings_json: string;
  updated_at: TimestampColumn;
};

export type TenantUsersTable = {
  created_at: TimestampColumn;
  email: string;
  id: string;
  name: string;
  password_hash: string;
  role: string;
  status: "active" | "inactive" | "suspended";
  updated_at: TimestampColumn;
};
