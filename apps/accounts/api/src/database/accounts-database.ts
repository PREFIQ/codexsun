import { Kysely, MysqlDialect } from "kysely";
import { createPool, type PoolOptions } from "mysql2";
import { createConnection } from "mysql2/promise";
import { env } from "../env.js";
import { migrateLedgersModule } from "../modules/ledgers/index.js";
import { seedLedgersModule } from "../modules/ledgers/index.js";
import { migrateVouchersModule } from "../modules/vouchers/index.js";
import { migrateReportsModule } from "../modules/reports/index.js";

export type AccountsDatabase = Record<string, unknown>;

const connections = new Map<string, Kysely<AccountsDatabase>>();
const migrated = new Set<string>();

export function resolveAccountsDatabaseName(value: unknown) {
  const requested = typeof value === "string" ? value.trim() : "";
  return assertDatabaseName(requested || env.DB_MASTER_NAME);
}

export async function getAccountsDatabase(databaseName = env.DB_MASTER_NAME) {
  const name = assertDatabaseName(databaseName);
  await bootstrapAccountsDatabase(name);
  return openAccountsDatabase(name);
}

export async function bootstrapAccountsDatabase(databaseName = env.DB_MASTER_NAME) {
  const name = assertDatabaseName(databaseName);
  if (migrated.has(name)) return;

  await ensureDatabase(name);
  const db = openAccountsDatabase(name);
  await migrateLedgersModule(db);
  await migrateVouchersModule(db);
  await migrateReportsModule(db);
  await seedLedgersModule(db);
  migrated.add(name);
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
    await connection.query(`CREATE DATABASE IF NOT EXISTS \`${name}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
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
