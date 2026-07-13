import { Kysely, MysqlDialect, sql } from "kysely";
import { createPool, type PoolOptions } from "mysql2";
import { createConnection } from "mysql2/promise";
import { AppError } from "@codexsun/framework/errors";
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
import { SalesRepository } from "../modules/sales/sales.repository.js";
import { seedSalesModule } from "../modules/sales/sales.seed.js";
import {
  billingSettingsMigration,
  migrateBillingSettingsModule
} from "../modules/settings/settings.migration.js";
import { BillingSettingsRepository } from "../modules/settings/settings.repository.js";

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

const connections = new Map<string, Kysely<BillingDatabase>>();
const migrated = new Set<string>();
const bootstrapping = new Map<string, Promise<void>>();
const bootstrapTimeoutMs = 5_000;

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
  try {
    await withTimeout(
      bootstrapPromise,
      bootstrapTimeoutMs,
      `Billing database bootstrap timed out after ${bootstrapTimeoutMs}ms for ${name}`
    );
  } finally {
    bootstrapping.delete(name);
  }
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
  migrated.add(name);
  try {
    await seedSalesModule(db);
    await seedExportSalesModule(db);
    await seedPaymentModule(db);
    await seedReceiptModule(db);
    const settingsRepository = new BillingSettingsRepository();
    const settings = await settingsRepository.getSalesSettings(name);
    const sales = await new SalesRepository().list(name);
    const nextNumber = nextAvailableSalesNumber(
      sales.map((sale) => sale.invoiceNumber),
      settings.numbering.sales
    );
    await settingsRepository.saveSalesSettings(name, {
      ...settings,
      numbering: {
        ...settings.numbering,
        sales: { ...settings.numbering.sales, nextNumber }
      }
    });
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

function nextAvailableSalesNumber(
  invoiceNumbers: string[],
  settings: {
    nextNumber: number;
    prefix: string;
    separator: string;
    suffix: string;
    usePrefix: boolean;
    useSeparator: boolean;
    useSuffix: boolean;
  }
) {
  const prefix = `${settings.usePrefix ? settings.prefix : ""}${settings.useSeparator ? settings.separator : ""}`;
  const suffix = settings.useSuffix ? settings.suffix : "";
  const escapedPrefix = prefix.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const escapedSuffix = suffix.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const pattern = new RegExp(`^${escapedPrefix}(\\d+)${escapedSuffix}$`, "i");
  const highestExisting = invoiceNumbers.reduce((highest, invoiceNumber) => {
    const match = invoiceNumber.trim().match(pattern);
    return Math.max(highest, match ? Number(match[1]) : 0);
  }, 0);
  return Math.max(1, settings.nextNumber, highestExisting + 1);
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
