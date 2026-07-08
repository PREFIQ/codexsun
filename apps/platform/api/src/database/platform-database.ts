import { Kysely, MysqlDialect, sql } from "kysely";
import { createPool, type PoolOptions } from "mysql2";
import { createConnection } from "mysql2/promise";
import { env } from "../env.js";
import { migrateAppRegistryModule } from "../modules/app-registry/app-registry.migration.js";
import { seedAppRegistryModule } from "../modules/app-registry/app-registry.seed.js";
import { migrateTenantDomainModule } from "../modules/tenant-domain/tenant-domain.migration.js";
import { migrateTenantRegistryModule } from "../modules/tenant/tenant.migration.js";
import { migratePlanModule } from "../modules/plan/plan.migration.js";
import { seedPlanModule } from "../modules/plan/plan.seed.js";
import { migrateSubscriptionModule } from "../modules/subscription/subscription.migration.js";
import { seedSubscriptionModule } from "../modules/subscription/subscription.seed.js";
import { migrateIndustryModule } from "../modules/industry/industry.migration.js";
import { seedIndustryModule } from "../modules/industry/industry.seed.js";
import { migrateEntitlementModule } from "../modules/entitlement/entitlement.migration.js";
import { seedEntitlementModule } from "../modules/entitlement/entitlement.seed.js";
import { migrateAccessControlModule } from "../modules/access-control/access-control.migration.js";
import { seedAccessControlModule } from "../modules/access-control/access-control.seed.js";
import { migratePlatformActivityModule } from "../modules/platform-activity/platform-activity.migration.js";
import { seedPlatformActivityModule } from "../modules/platform-activity/platform-activity.seed.js";
import { migrateDatabaseMaintenanceModule } from "../modules/database-maintenance/database-maintenance.migration.js";
import { seedDatabaseMaintenanceModule } from "../modules/database-maintenance/database-maintenance.seed.js";
import { migrateQueueManagerModule } from "../modules/queue-manager/queue-manager.migration.js";
import { seedQueueManagerModule } from "../modules/queue-manager/queue-manager.seed.js";
import { migrateStorageManagerModule } from "../modules/storage-manager/storage-manager.migration.js";
import { seedStorageManagerModule } from "../modules/storage-manager/storage-manager.seed.js";
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

  await migrateAppRegistryModule(database);
  await migrateTenantRegistryModule(database);
  await migrateTenantDomainModule(database);
  await migratePlanModule(database);
  await migrateSubscriptionModule(database);
  await migrateIndustryModule(database);
  await migrateEntitlementModule(database);
  await migrateAccessControlModule(database);
  await migratePlatformActivityModule(database);
  await migrateDatabaseMaintenanceModule(database);
  await migrateQueueManagerModule(database);
  await migrateStorageManagerModule(database);

  await database.insertInto("codexsun_migrations").ignore().values({ name: "001_platform_foundation" }).execute();
  console.info("[database] platform migration applied: 001_platform_foundation");
}

export async function seedPlatformDatabase() {
  const database = getPlatformDatabase();
  await seedAppRegistryModule(database);
  await seedPlanModule(database);
  await seedSubscriptionModule(database);
  await seedIndustryModule(database);
  await seedEntitlementModule(database);
  await seedAccessControlModule(database);
  await seedPlatformActivityModule(database);
  await seedDatabaseMaintenanceModule(database);
  await seedQueueManagerModule(database);
  await seedStorageManagerModule(database);
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
