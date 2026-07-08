import { Kysely, MysqlDialect, sql } from "kysely";
import { createPool, type PoolOptions } from "mysql2";
import { createConnection } from "mysql2/promise";
import { env } from "../env.js";
import { platformAppRegistry } from "../modules/app-registry/app-registry.service.js";
import { assertDatabaseName, quoteIdentifier } from "./database-utils.js";
import type { PlatformDatabase } from "./schema.js";

let platformDatabase: Kysely<PlatformDatabase> | null = null;
let bootstrapped = false;

export function platformDatabaseConfig() {
  return {
    database: platformDatabaseName(),
    host: env.DB_HOST,
    password: env.DB_PASSWORD,
    port: env.DB_PORT,
    user: env.DB_USER
  };
}

export function platformDatabaseName() {
  return assertDatabaseName(env.DB_MASTER_NAME, "master database name");
}

export function getPlatformDatabase() {
  if (!platformDatabase) {
    platformDatabase = new Kysely<PlatformDatabase>({
      dialect: new MysqlDialect({
        pool: createPool({
          ...platformDatabaseConfig(),
          connectionLimit: 10,
          timezone: "Z"
        } satisfies PoolOptions)
      })
    });
  }

  return platformDatabase;
}

export async function bootstrapPlatformDatabase() {
  if (bootstrapped || process.env.CODEXSUN_DEV_SKIP_DB === "1") {
    return;
  }

  await createMasterDatabase();
  await migratePlatformDatabase();
  await seedPlatformDatabase();
  bootstrapped = true;
}

export async function closePlatformDatabase() {
  if (platformDatabase) {
    await platformDatabase.destroy();
    platformDatabase = null;
  }
  bootstrapped = false;
}

async function createMasterDatabase() {
  const connection = await createConnection({
    host: env.DB_HOST,
    password: env.DB_PASSWORD,
    port: env.DB_PORT,
    user: env.DB_USER,
    timezone: "Z"
  });
  try {
    await connection.query(
      `CREATE DATABASE IF NOT EXISTS ${quoteIdentifier(platformDatabaseName())} CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`
    );
  } finally {
    await connection.end();
  }
}

async function migratePlatformDatabase() {
  const database = getPlatformDatabase();
  await database.schema
    .createTable("codexsun_migrations")
    .ifNotExists()
    .addColumn("id", "integer", (col) => col.primaryKey().autoIncrement())
    .addColumn("name", "varchar(160)", (col) => col.notNull().unique())
    .addColumn("applied_at", "datetime", (col) => col.notNull().defaultTo(sql`CURRENT_TIMESTAMP`))
    .execute();

  await database.schema
    .createTable("platform_apps")
    .ifNotExists()
    .addColumn("id", "varchar(64)", (col) => col.primaryKey())
    .addColumn("label", "varchar(120)", (col) => col.notNull())
    .addColumn("module_key", "varchar(160)", (col) => col.notNull().unique())
    .addColumn("stack", "varchar(64)", (col) => col.notNull())
    .addColumn("always_enabled", "boolean", (col) => col.notNull().defaultTo(false))
    .addColumn("default_landing", "boolean", (col) => col.notNull().defaultTo(false))
    .addColumn("description", "text", (col) => col.notNull())
    .addColumn("created_at", "datetime", (col) => col.notNull().defaultTo(sql`CURRENT_TIMESTAMP`))
    .addColumn("updated_at", "datetime", (col) => col.notNull().defaultTo(sql`CURRENT_TIMESTAMP`))
    .execute();

  await database.schema
    .createTable("tenants")
    .ifNotExists()
    .addColumn("id", "integer", (col) => col.primaryKey().autoIncrement())
    .addColumn("public_id", "varchar(120)", (col) => col.unique())
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
    .createTable("tenant_domains")
    .ifNotExists()
    .addColumn("id", "integer", (col) => col.primaryKey().autoIncrement())
    .addColumn("tenant_id", "varchar(120)", (col) => col.notNull())
    .addColumn("domain", "varchar(191)", (col) => col.notNull().unique())
    .addColumn("is_primary", "boolean", (col) => col.notNull().defaultTo(false))
    .addColumn("created_at", "datetime", (col) => col.notNull().defaultTo(sql`CURRENT_TIMESTAMP`))
    .execute();

  await database.schema
    .createTable("tenant_audit_events")
    .ifNotExists()
    .addColumn("id", "integer", (col) => col.primaryKey().autoIncrement())
    .addColumn("tenant_id", "varchar(120)", (col) => col.notNull())
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

  await database.insertInto("codexsun_migrations").ignore().values({ name: "001_platform_foundation" }).execute();
}

async function ensureTenantColumns(database: ReturnType<typeof getPlatformDatabase>) {
  await addColumnIfMissing(database, "tenants", "public_id", "VARCHAR(120) NULL UNIQUE");
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
  await addColumnIfMissing(database, "tenants", "created_at", "DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP");
  await addColumnIfMissing(database, "tenants", "updated_at", "DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP");
}

async function addColumnIfMissing(database: ReturnType<typeof getPlatformDatabase>, tableName: string, columnName: string, definition: string) {
  const tables = await database.introspection.getTables();
  const table = tables.find((candidate) => candidate.name === tableName);
  if (!table || table.columns.some((column) => column.name === columnName)) {
    return;
  }
  await sql.raw(`ALTER TABLE \`${tableName}\` ADD COLUMN \`${columnName}\` ${definition}`).execute(database);
}

async function seedPlatformDatabase() {
  const database = getPlatformDatabase();
  for (const app of platformAppRegistry) {
    await database
      .insertInto("platform_apps")
      .values({
        always_enabled: app.alwaysEnabled,
        default_landing: app.defaultLanding,
        description: app.description,
        id: app.id,
        label: app.label,
        module_key: app.moduleKey,
        stack: app.stack
      })
      .onDuplicateKeyUpdate({
        always_enabled: app.alwaysEnabled,
        default_landing: app.defaultLanding,
        description: app.description,
        label: app.label,
        module_key: app.moduleKey,
        stack: app.stack,
        updated_at: sql`CURRENT_TIMESTAMP`
      })
      .execute();
  }
}
