import { Kysely, MysqlDialect } from "kysely";
import { createPool, type PoolOptions } from "mysql2";
import { createConnection } from "mysql2/promise";
import { env } from "../env.js";
import { migrateQuotationModule } from "../modules/quotation/quotation.migration.js";
import { migrateSalesModule } from "../modules/sales/sales.migration.js";
import { seedSalesModule } from "../modules/sales/sales.seed.js";
import { migrateBillingSettingsModule } from "../modules/settings/settings.migration.js";
import { BillingSettingsRepository } from "../modules/settings/settings.repository.js";

export type BillingDatabase = {
  billing_sales: BillingSalesTable;
};

export type BillingSalesTable = {
  amount: number;
  currency_code: string;
  customer_name: string;
  id: string;
  invoice_number: string;
  issued_on: string;
  status: "draft" | "confirmed" | "cancelled";
};

const connections = new Map<string, Kysely<BillingDatabase>>();
const migrated = new Set<string>();
const bootstrapping = new Map<string, Promise<void>>();
const bootstrapTimeoutMs = 5_000;

export function resolveBillingDatabaseName(value: unknown) {
  const requested = typeof value === "string" ? value.trim() : "";
  return assertDatabaseName(requested || env.DB_MASTER_NAME);
}

export async function getBillingDatabase(databaseName = env.DB_MASTER_NAME) {
  const name = assertDatabaseName(databaseName);
  await bootstrapBillingDatabase(name);
  return openBillingDatabase(name);
}

export async function bootstrapBillingDatabase(databaseName = env.DB_MASTER_NAME) {
  const name = assertDatabaseName(databaseName);
  if (migrated.has(name)) {
    return;
  }

  const activeBootstrap = bootstrapping.get(name);
  if (activeBootstrap) {
    await withTimeout(activeBootstrap, bootstrapTimeoutMs, `Billing database bootstrap timed out after ${bootstrapTimeoutMs}ms for ${name}`);
    return;
  }

  const bootstrapPromise = bootstrapBillingDatabaseOnce(name);
  bootstrapping.set(name, bootstrapPromise);
  try {
    await withTimeout(bootstrapPromise, bootstrapTimeoutMs, `Billing database bootstrap timed out after ${bootstrapTimeoutMs}ms for ${name}`);
  } finally {
    bootstrapping.delete(name);
  }
}

async function bootstrapBillingDatabaseOnce(name: string) {
  await ensureDatabase(name);
  const db = openBillingDatabase(name);
  await migrateSalesModule(db);
  await migrateQuotationModule(db);
  await migrateBillingSettingsModule(db);
  migrated.add(name);
  try {
    await seedSalesModule(db);
    const settingsRepository = new BillingSettingsRepository();
    await settingsRepository.saveSalesSettings(name, await settingsRepository.getSalesSettings(name));
  } catch (error) {
    migrated.delete(name);
    throw error;
  }
}

function openBillingDatabase(databaseName: string) {
  const name = assertDatabaseName(databaseName);
  const existing = connections.get(name);
  if (existing) {
    return existing;
  }

  const db = new Kysely<BillingDatabase>({
    dialect: new MysqlDialect({
      pool: createPool({
        database: name,
        host: env.DB_HOST,
        password: env.DB_PASSWORD,
        port: env.DB_PORT,
        timezone: "Z",
        user: env.DB_USER,
        connectTimeout: 5_000
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
    user: env.DB_USER,
    connectTimeout: 5_000
  });
  try {
    await connection.query(`CREATE DATABASE IF NOT EXISTS \`${name}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
  } finally {
    await connection.end();
  }
}

export async function closeAllBillingDatabases() {
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

function withTimeout<T>(promise: Promise<T>, timeoutMs: number, message: string) {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(message)), timeoutMs);
    timer.unref();
    promise.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (error: unknown) => {
        clearTimeout(timer);
        reject(error);
      }
    );
  });
}
