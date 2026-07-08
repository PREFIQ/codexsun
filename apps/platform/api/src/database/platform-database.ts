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
    if (process.env.CODEXSUN_DEV_SKIP_DB === "1") {
      console.info("[database] bootstrap skipped because CODEXSUN_DEV_SKIP_DB=1");
    }
    return;
  }

  if (env.CODEXSUN_DB_FRESH_ON_START === "1") {
    console.info("[database] fresh startup requested");
    await resetPlatformDatabases();
    return;
  }

  console.info("[database] bootstrap started");
  await createMasterDatabase();
  await migratePlatformDatabase();
  await seedPlatformDatabase();
  bootstrapped = true;
  console.info(`[database] bootstrap completed for master database "${platformDatabaseName()}"`);
}

export async function closePlatformDatabase() {
  if (platformDatabase) {
    await platformDatabase.destroy();
    platformDatabase = null;
  }
  bootstrapped = false;
}

export async function createMasterDatabase() {
  const databaseName = platformDatabaseName();
  console.info(`[database] ensuring master database "${databaseName}" on ${env.DB_HOST}:${env.DB_PORT}`);
  const connection = await createConnection({
    host: env.DB_HOST,
    password: env.DB_PASSWORD,
    port: env.DB_PORT,
    user: env.DB_USER,
    timezone: "Z"
  });
  try {
    await connection.query(
      `CREATE DATABASE IF NOT EXISTS ${quoteIdentifier(databaseName)} CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`
    );
    console.info(`[database] master database ready: "${databaseName}"`);
  } finally {
    await connection.end();
  }
}

export async function migratePlatformDatabase() {
  console.info(`[database] migrating platform database "${platformDatabaseName()}"`);
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
  console.info(`[database] platform migration applied: 001_platform_foundation`);
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

export async function seedPlatformDatabase() {
  console.info(`[seeder] seeding platform app registry (${platformAppRegistry.length} apps)`);
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
    console.info(`[seeder] platform app ready: ${app.moduleKey}`);
  }
  console.info("[seeder] platform app registry seed completed");
}

export async function resetPlatformDatabases() {
  assertDestructiveDatabaseAction("fresh database startup");
  console.warn(`
DATABASE WARNING
Fresh database mode is enabled. CODEXSUN will drop configured tenant databases and the master database, then recreate and seed them.
`);
  await dropPlatformDatabases();
  await createMasterDatabase();
  await migratePlatformDatabase();
  await seedPlatformDatabase();
  bootstrapped = true;
}

export async function dropPlatformDatabases() {
  assertDestructiveDatabaseAction("drop database");
  await closePlatformDatabase();

  const connection = await createConnection({
    host: env.DB_HOST,
    password: env.DB_PASSWORD,
    port: env.DB_PORT,
    user: env.DB_USER,
    timezone: "Z"
  });

  try {
    const masterName = platformDatabaseName();
    const tenantDatabaseNames = await listTenantDatabaseNames(connection, masterName);
    for (const tenantDatabaseName of tenantDatabaseNames) {
      if (tenantDatabaseName === masterName) {
        continue;
      }
      console.warn(`[database] dropping tenant database "${tenantDatabaseName}"`);
      await connection.query(`DROP DATABASE IF EXISTS ${quoteIdentifier(tenantDatabaseName)}`);
    }

    console.warn(`[database] dropping master database "${masterName}"`);
    await connection.query(`DROP DATABASE IF EXISTS ${quoteIdentifier(masterName)}`);
  } finally {
    await connection.end();
  }

  bootstrapped = false;
}

function assertDestructiveDatabaseAction(action: string) {
  if (env.CODEXSUN_DB_RESET_CONFIRM !== "DROP_DATABASES") {
    throw new Error(
      `${action} refused. Set CODEXSUN_DB_RESET_CONFIRM=DROP_DATABASES only when you intentionally want to delete configured databases.`
    );
  }

  if (env.NODE_ENV === "production" && env.CODEXSUN_ALLOW_PRODUCTION_DB_RESET !== "1") {
    throw new Error(
      `${action} refused in production. Set CODEXSUN_ALLOW_PRODUCTION_DB_RESET=1 and CODEXSUN_DB_RESET_CONFIRM=DROP_DATABASES to continue.`
    );
  }
}

async function listTenantDatabaseNames(connection: Awaited<ReturnType<typeof createConnection>>, masterName: string) {
  const [databases] = await connection.query(`SHOW DATABASES LIKE ?`, [masterName]);
  if (!Array.isArray(databases) || databases.length === 0) {
    return [];
  }

  let rows: unknown;
  try {
    [rows] = await connection.query(`SELECT db_name FROM ${quoteIdentifier(masterName)}.tenants`);
  } catch {
    return [];
  }
  if (!Array.isArray(rows)) {
    return [];
  }

  const names = new Set<string>();
  for (const row of rows as Array<{ db_name?: unknown }>) {
    if (typeof row.db_name === "string" && row.db_name.trim()) {
      names.add(assertDatabaseName(row.db_name.trim(), "tenant database name"));
    }
  }

  return Array.from(names);
}
