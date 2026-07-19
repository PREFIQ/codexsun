import { Kysely, MysqlDialect, sql } from "kysely";
import { createPool, type PoolOptions } from "mysql2";
import { createConnection } from "mysql2/promise";
import { AppError } from "@codexsun/framework/errors";
import { seedBillingTenantPermissions } from "../auth/tenant-permission.seed.js";
import { env } from "../env.js";
import {
  migrateQuotationModule,
  quotationMigration
} from "../modules/quotation/quotation.migration.js";
import {
  exportSalesMigration,
  migrateExportSalesModule
} from "../modules/export-sales/export-sales.migration.js";
import { seedExportSalesModule } from "../modules/export-sales/export-sales.seed.js";
import { migratePaymentModule, paymentMigration } from "../modules/payment/payment.migration.js";
import { seedPaymentModule } from "../modules/payment/payment.seed.js";
import {
  migratePurchaseModule,
  purchaseMigration
} from "../modules/purchase/purchase.migration.js";
import { migrateSalesModule, salesMigration } from "../modules/sales/sales.migration.js";
import { migrateReceiptModule, receiptMigration } from "../modules/receipt/receipt.migration.js";
import { seedReceiptModule } from "../modules/receipt/receipt.seed.js";
import { seedSalesModule } from "../modules/sales/sales.seed.js";
import {
  billingSettingsMigration,
  migrateBillingSettingsModule
} from "../modules/settings/settings.migration.js";
import { BillingSettingsRepository } from "../modules/settings/settings.repository.js";
import {
  dashboardMigration,
  migrateDashboardModule
} from "../modules/dashboard/dashboard.migration.js";
import { seedDashboardModule } from "../modules/dashboard/dashboard.seed.js";

export type BillingDatabase = {
  billing_quotations: BillingQuotationTable;
  billing_sales: BillingSalesTable;
};

export type BillingQuotationTable = {
  amount: number;
  billing_address_id: number;
  company_id: number;
  currency_id: number;
  customer_id: number;
  financial_year_id: number;
  id: number;
  quotation_date: string;
  quotation_number: string;
  line_number: number;
  shipping_address_id: number;
  status: "draft" | "confirmed" | "cancelled";
  uuid: string;
};

export type BillingSalesTable = {
  amount: number;
  billing_address_id: number;
  company_id: number;
  currency_id: number;
  customer_id: number;
  financial_year_id: number;
  id: number;
  invoice_number: string;
  issued_on: string;
  line_number: number;
  shipping_address_id: number;
  status: "draft" | "confirmed" | "cancelled";
  uuid: string;
};

type BillingConnectionEntry = { database: Kysely<BillingDatabase>; lastUsedAt: number };

const connections = new Map<string, BillingConnectionEntry>();
const migrated = new Set<string>();
const bootstrapping = new Map<string, Promise<void>>();
const bootstrapTimeoutMs = 5_000;
const connectionIdleMs = 10 * 60 * 1000;
const evictionTimer = setInterval(() => void evictIdleBillingDatabases(), 60_000);
evictionTimer.unref();

export const billingTenantMigrations = [
  { description: "Billing sales documents and relational line items.", name: salesMigration.key },
  {
    description: "Billing purchase documents and relational line items.",
    name: purchaseMigration.key
  },
  {
    description: "Billing export-sales documents and relational line items.",
    name: exportSalesMigration.key
  },
  {
    description: "Billing quotations and relational line items.",
    name: quotationMigration.key
  },
  { description: "Billing payment documents.", name: paymentMigration.key },
  { description: "Billing receipt documents.", name: receiptMigration.key },
  { description: "Company-owned Billing settings.", name: billingSettingsMigration.key },
  { description: "Billing dashboard snapshots.", name: dashboardMigration.key }
] as const;

export function resolveBillingDatabaseName(value: unknown) {
  const requested = typeof value === "string" ? value.trim() : "";
  if (!requested) throw AppError.validation("x-tenant-db is required for Billing database access.");
  if (!/^[a-zA-Z0-9_]+$/.test(requested))
    throw AppError.validation("Invalid tenant database name.");
  const name = requested;
  if (name === env.DB_MASTER_NAME)
    throw AppError.validation("Billing tables cannot use the Platform master database.");
  return name;
}

export async function getBillingDatabase(databaseName: string) {
  const name = assertDatabaseName(databaseName);
  await bootstrapBillingDatabase(name);
  return openBillingDatabase(name);
}

export async function bootstrapBillingDatabase(databaseName: string) {
  const name = assertDatabaseName(databaseName);
  if (migrated.has(name)) {
    return;
  }

  const activeBootstrap = bootstrapping.get(name);
  if (activeBootstrap) {
    await withTimeout(
      activeBootstrap,
      bootstrapTimeoutMs,
      `Billing database bootstrap timed out after ${bootstrapTimeoutMs}ms for ${name}`
    );
    return;
  }

  const bootstrapPromise = bootstrapBillingDatabaseOnce(name);
  bootstrapping.set(name, bootstrapPromise);
  void bootstrapPromise.then(
    () => {
      if (bootstrapping.get(name) === bootstrapPromise) bootstrapping.delete(name);
    },
    () => {
      if (bootstrapping.get(name) === bootstrapPromise) bootstrapping.delete(name);
    }
  );
  await withTimeout(
    bootstrapPromise,
    bootstrapTimeoutMs,
    `Billing database bootstrap timed out after ${bootstrapTimeoutMs}ms for ${name}`
  );
}

export async function migrateBillingTenantDatabase(databaseName: string) {
  const name = assertDatabaseName(databaseName);
  const active = bootstrapping.get(name);
  if (active) await active.catch(() => undefined);
  await closeBillingDatabaseConnection(name);
  migrated.delete(name);
  await bootstrapBillingDatabase(name);
}

async function bootstrapBillingDatabaseOnce(name: string) {
  await ensureDatabase(name);
  const db = openBillingDatabase(name);
  await migrateSalesModule(db);
  await recordBillingMigration(db, salesMigration.key);
  await migratePurchaseModule(db);
  await recordBillingMigration(db, purchaseMigration.key);
  await migrateExportSalesModule(db);
  await recordBillingMigration(db, exportSalesMigration.key);
  await migrateQuotationModule(db);
  await recordBillingMigration(db, quotationMigration.key);
  await migratePaymentModule(db);
  await recordBillingMigration(db, paymentMigration.key);
  await migrateReceiptModule(db);
  await recordBillingMigration(db, receiptMigration.key);
  await migrateBillingSettingsModule(db);
  await recordBillingMigration(db, billingSettingsMigration.key);
  await migrateDashboardModule(db);
  await recordBillingMigration(db, dashboardMigration.key);
  await seedBillingTenantPermissions(db as unknown as Kysely<unknown>);
  migrated.add(name);
  try {
    await seedSalesModule(db);
    await seedExportSalesModule(db);
    await seedPaymentModule(db);
    await seedReceiptModule(db);
    await seedDashboardModule(name);
    const settingsRepository = new BillingSettingsRepository();
    const companyId = await settingsRepository.defaultCompanyId(name);
    await settingsRepository.getBillingSettings(name, companyId);
  } catch (error) {
    migrated.delete(name);
    throw error;
  }
}

async function recordBillingMigration(database: Kysely<BillingDatabase>, name: string) {
  await sql`INSERT IGNORE INTO schema_migrations (name) VALUES (${name})`.execute(database);
}

export async function bootstrapRegisteredBillingDatabases() {
  const databaseNames = await registeredTenantDatabaseNames();
  await Promise.all(databaseNames.map((databaseName) => bootstrapBillingDatabase(databaseName)));
}

function openBillingDatabase(databaseName: string) {
  const name = assertDatabaseName(databaseName);
  const existing = connections.get(name);
  if (existing) {
    existing.lastUsedAt = Date.now();
    return existing.database;
  }

  const db = new Kysely<BillingDatabase>({
    dialect: new MysqlDialect({
      pool: createPool({
        database: name,
        host: env.DB_HOST,
        password: env.DB_PASSWORD,
        port: env.DB_PORT,
        connectionLimit: 4,
        idleTimeout: 60_000,
        maxIdle: 1,
        queueLimit: 100,
        timezone: "Z",
        user: env.DB_USER,
        connectTimeout: 5_000
      } satisfies PoolOptions)
    })
  });
  connections.set(name, { database: db, lastUsedAt: Date.now() });
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
    user: env.DB_USER,
    connectTimeout: 5_000
  });
  try {
    const [rows] = await connection.query(
      "SELECT db_name FROM tenants WHERE db_name IS NOT NULL AND status <> 'deleted'"
    );
    return (rows as Array<{ db_name: string }>).map(({ db_name }) =>
      resolveBillingDatabaseName(db_name)
    );
  } finally {
    await connection.end();
  }
}

export async function closeAllBillingDatabases() {
  const openConnections = Array.from(connections.values(), (entry) => entry.database);
  connections.clear();
  migrated.clear();
  await Promise.all(openConnections.map(async (database) => database.destroy()));
}

async function closeBillingDatabaseConnection(name: string) {
  const entry = connections.get(name);
  if (!entry) return;
  connections.delete(name);
  await entry.database.destroy();
}

export async function evictIdleBillingDatabases(now = Date.now()) {
  const idle = Array.from(connections.entries()).filter(
    ([name, entry]) => now - entry.lastUsedAt >= connectionIdleMs && !bootstrapping.has(name)
  );
  for (const [name, entry] of idle) {
    if (connections.get(name) !== entry) continue;
    connections.delete(name);
    await entry.database.destroy();
  }
  return idle.length;
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
