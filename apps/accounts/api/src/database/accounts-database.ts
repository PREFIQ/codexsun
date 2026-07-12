import { Kysely, MysqlDialect } from "kysely";
import { createPool, type PoolOptions } from "mysql2";
import { createConnection } from "mysql2/promise";
import { env } from "../env.js";
import { migrateLedgersModule } from "../modules/ledgers/index.js";
import { seedLedgersModule } from "../modules/ledgers/index.js";
import { migrateVouchersModule } from "../modules/vouchers/index.js";
import { migrateReportsModule } from "../modules/reports/index.js";
import {
  migrateAccountsSettingsModule,
  seedAccountsSettingsModule
} from "../modules/settings/index.js";

export type AccountsDatabase = Record<string, unknown>;

const connections = new Map<string, Kysely<AccountsDatabase>>();
const migrated = new Set<string>();

export function resolveAccountsDatabaseName(value: unknown) {
  const requested = typeof value === "string" ? value.trim() : "";
  if (!requested) throw new Error("x-tenant-db is required for Accounts database access.");
  const name = assertDatabaseName(requested);
  if (name === env.DB_MASTER_NAME)
    throw new Error("Accounts tables cannot use the Platform master database.");
  return name;
}

export async function getAccountsDatabase(databaseName: string) {
  const name = assertDatabaseName(databaseName);
  await bootstrapAccountsDatabase(name);
  return openAccountsDatabase(name);
}

export async function bootstrapAccountsDatabase(databaseName: string) {
  const name = assertDatabaseName(databaseName);
  if (migrated.has(name)) return;

  await ensureDatabase(name);
  const db = openAccountsDatabase(name);
  await migrateLedgersModule(db);
  await migrateVouchersModule(db);
  await migrateReportsModule(db);
  await migrateAccountsSettingsModule(db);
  await seedLedgersModule(db);
  await seedAccountsSettingsModule(db);
  migrated.add(name);
}

export async function bootstrapRegisteredAccountsDatabases() {
  const databaseNames = await registeredTenantDatabaseNames();
  await Promise.all(databaseNames.map((databaseName) => bootstrapAccountsDatabase(databaseName)));
}

function openAccountsDatabase(databaseName: string) {
  const name = assertDatabaseName(databaseName);
  const existing = connections.get(name);
  if (existing) return existing;

  const db = new Kysely<AccountsDatabase>({
    dialect: new MysqlDialect({
      pool: createPool({
        database: name,
        host: env.DB_HOST,
        password: env.DB_PASSWORD,
        port: env.DB_PORT,
        timezone: "Z",
        user: env.DB_USER
      } satisfies PoolOptions)
    })
  });
  connections.set(name, db);
  return db;
}

async function ensureDatabase(databaseName: string) {
  const name = assertDatabaseName(databaseName);
  const connection = await createConnection({
    host: env.DB_HOST,
    password: env.DB_PASSWORD,
    port: env.DB_PORT,
    timezone: "Z",
    user: env.DB_USER
  });
  try {
    await connection.query(
      `CREATE DATABASE IF NOT EXISTS \`${name}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`
    );
  } finally {
    await connection.end();
  }
}

async function registeredTenantDatabaseNames() {
  const connection = await createConnection({
    database: env.DB_MASTER_NAME,
    host: env.DB_HOST,
    password: env.DB_PASSWORD,
    port: env.DB_PORT,
    timezone: "Z",
    user: env.DB_USER
  });
  try {
    const [rows] = await connection.query(
      "SELECT db_name FROM tenants WHERE db_name IS NOT NULL AND status <> 'deleted'"
    );
    return (rows as Array<{ db_name: string }>).map(({ db_name }) =>
      resolveAccountsDatabaseName(db_name)
    );
  } finally {
    await connection.end();
  }
}

export async function closeAllAccountsDatabases() {
  const openConnections = Array.from(connections.values());
  connections.clear();
  migrated.clear();
  await Promise.all(openConnections.map(async (database) => database.destroy()));
}

function assertDatabaseName(value: string) {
  if (!/^[a-zA-Z0-9_]+$/.test(value)) {
    throw new Error(`Invalid database name: ${value}`);
  }
  return value;
}
