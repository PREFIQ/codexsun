import { sql, type Kysely } from "kysely";
import type { PlatformDatabase, TenantDatabase } from "../../database/schema.js";

export const tenantMigration = {
  key: "platform.tenant.foundation",
  status: "active"
} as const;

export const tenantRuntimeMigrations = [
  {
    description: "Tenant runtime foundation tables, module settings, users, and tenant migration ledger.",
    name: "001_tenant_foundation",
    statements: [
      "CREATE TABLE IF NOT EXISTS tenant_migrations (...)",
      "CREATE TABLE IF NOT EXISTS tenant_module_settings (...)",
      "CREATE TABLE IF NOT EXISTS tenant_users (...)",
      "INSERT IGNORE INTO tenant_migrations (name) VALUES ('001_tenant_foundation')"
    ]
  }
] as const;

export async function migrateTenantRegistryModule(database: Kysely<PlatformDatabase>) {
  await database.schema
    .createTable("tenants")
    .ifNotExists()
    .addColumn("id", "integer", (col) => col.primaryKey().autoIncrement())
    .addColumn("uuid", "varchar(8)", (col) => col.notNull().unique())
    .addColumn("tenant_code", "varchar(64)", (col) => col.notNull().unique())
    .addColumn("tenant_name", "varchar(180)", (col) => col.notNull())
    .addColumn("corporate_id", "varchar(120)")
    .addColumn("mobile", "varchar(40)")
    .addColumn("slug", "varchar(120)", (col) => col.notNull().unique())
    .addColumn("status", "varchar(32)", (col) => col.notNull())
    .addColumn("db_type", "varchar(32)", (col) => col.notNull())
    .addColumn("db_host", "varchar(180)", (col) => col.notNull())
    .addColumn("db_port", "integer", (col) => col.notNull())
    .addColumn("db_name", "varchar(120)", (col) => col.notNull())
    .addColumn("db_user", "varchar(120)", (col) => col.notNull())
    .addColumn("db_secret_ref", "varchar(180)", (col) => col.notNull())
    .addColumn("enabled_module_keys", "json", (col) => col.notNull())
    .addColumn("default_landing_app", "varchar(64)", (col) => col.notNull())
    .addColumn("payload_settings", "json", (col) => col.notNull())
    .addColumn("created_at", "datetime", (col) => col.notNull().defaultTo(sql`CURRENT_TIMESTAMP`))
    .addColumn("updated_at", "datetime", (col) => col.notNull().defaultTo(sql`CURRENT_TIMESTAMP`))
    .execute();
  await ensureTenantColumns(database);

  await database.schema
    .createTable("tenant_audit_events")
    .ifNotExists()
    .addColumn("id", "integer", (col) => col.primaryKey().autoIncrement())
    .addColumn("uuid", "varchar(8)", (col) => col.notNull().unique())
    .addColumn("tenant_id", "integer", (col) => col.notNull())
    .addColumn("event_name", "varchar(120)", (col) => col.notNull())
    .addColumn("actor_email", "varchar(180)", (col) => col.notNull())
    .addColumn("created_at", "datetime", (col) => col.notNull().defaultTo(sql`CURRENT_TIMESTAMP`))
    .execute();

  await database.schema
    .createIndex("tenant_audit_events_tenant_id_idx")
    .ifNotExists()
    .on("tenant_audit_events")
    .column("tenant_id")
    .execute();
}

export async function migrateTenantRuntimeModule(database: Kysely<TenantDatabase>) {
  console.info("[database] migrating tenant runtime module tables");
  await database.schema
    .createTable("tenant_migrations")
    .ifNotExists()
    .addColumn("id", "integer", (col) => col.primaryKey().autoIncrement())
    .addColumn("name", "varchar(160)", (col) => col.notNull().unique())
    .addColumn("applied_at", "datetime", (col) => col.notNull().defaultTo(sql`CURRENT_TIMESTAMP`))
    .execute();

  await database.schema
    .createTable("tenant_module_settings")
    .ifNotExists()
    .addColumn("id", "integer", (col) => col.primaryKey().autoIncrement())
    .addColumn("uuid", "varchar(8)", (col) => col.notNull().unique())
    .addColumn("module_key", "varchar(160)", (col) => col.notNull().unique())
    .addColumn("enabled", "boolean", (col) => col.notNull().defaultTo(false))
    .addColumn("settings_json", "json", (col) => col.notNull())
    .addColumn("created_at", "datetime", (col) => col.notNull().defaultTo(sql`CURRENT_TIMESTAMP`))
    .addColumn("updated_at", "datetime", (col) => col.notNull().defaultTo(sql`CURRENT_TIMESTAMP`))
    .execute();

  await database.schema
    .createTable("tenant_users")
    .ifNotExists()
    .addColumn("id", "integer", (col) => col.primaryKey().autoIncrement())
    .addColumn("uuid", "varchar(8)", (col) => col.notNull().unique())
    .addColumn("name", "varchar(180)", (col) => col.notNull())
    .addColumn("email", "varchar(180)", (col) => col.notNull().unique())
    .addColumn("password_hash", "varchar(255)", (col) => col.notNull())
    .addColumn("role", "varchar(80)", (col) => col.notNull())
    .addColumn("status", "varchar(24)", (col) => col.notNull().defaultTo("active"))
    .addColumn("created_at", "datetime", (col) => col.notNull().defaultTo(sql`CURRENT_TIMESTAMP`))
    .addColumn("updated_at", "datetime", (col) => col.notNull().defaultTo(sql`CURRENT_TIMESTAMP`))
    .execute();

  await database.insertInto("tenant_migrations").ignore().values({ name: "001_tenant_foundation" }).execute();
  console.info("[database] tenant runtime migration applied: 001_tenant_foundation");
}

async function ensureTenantColumns(database: Kysely<PlatformDatabase>) {
  await addColumnIfMissing(database, "tenants", "uuid", "VARCHAR(8) NULL UNIQUE");
  await addColumnIfMissing(database, "tenants", "corporate_id", "VARCHAR(120) NULL");
  await addColumnIfMissing(database, "tenants", "mobile", "VARCHAR(40) NULL");
  await addColumnIfMissing(database, "tenants", "slug", "VARCHAR(120) NULL");
  await addColumnIfMissing(database, "tenants", "status", "VARCHAR(32) NOT NULL DEFAULT 'active'");
  await addColumnIfMissing(database, "tenants", "db_type", "VARCHAR(32) NOT NULL DEFAULT 'mariadb'");
  await addColumnIfMissing(database, "tenants", "db_host", "VARCHAR(180) NOT NULL DEFAULT '127.0.0.1'");
  await addColumnIfMissing(database, "tenants", "db_port", "INT NOT NULL DEFAULT 3306");
  await addColumnIfMissing(database, "tenants", "db_name", "VARCHAR(120) NULL");
  await addColumnIfMissing(database, "tenants", "db_user", "VARCHAR(120) NOT NULL DEFAULT 'root'");
  await addColumnIfMissing(database, "tenants", "db_secret_ref", "VARCHAR(180) NOT NULL DEFAULT 'DB_PASSWORD'");
  await addColumnIfMissing(database, "tenants", "enabled_module_keys", "LONGTEXT NULL");
  await addColumnIfMissing(database, "tenants", "default_landing_app", "VARCHAR(64) NOT NULL DEFAULT 'application'");
  await addColumnIfMissing(database, "tenants", "payload_settings", "LONGTEXT NULL");
  await addColumnIfMissing(database, "tenants", "storage_root", "VARCHAR(255) NOT NULL DEFAULT ''");
  await addColumnIfMissing(database, "tenants", "storage_public_root", "VARCHAR(255) NOT NULL DEFAULT ''");
  await addColumnIfMissing(database, "tenants", "storage_private_root", "VARCHAR(255) NOT NULL DEFAULT ''");
  await addColumnIfMissing(database, "tenants", "created_at", "DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP");
  await addColumnIfMissing(database, "tenants", "updated_at", "DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP");
}

async function addColumnIfMissing(database: Kysely<PlatformDatabase>, tableName: string, columnName: string, definition: string) {
  const tables = await database.introspection.getTables();
  const table = tables.find((candidate) => candidate.name === tableName);
  if (!table || table.columns.some((column) => column.name === columnName)) {
    return;
  }
  await sql.raw(`ALTER TABLE \`${tableName}\` ADD COLUMN \`${columnName}\` ${definition}`).execute(database);
}
