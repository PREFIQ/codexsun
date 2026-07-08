import { Kysely, MysqlDialect, sql } from "kysely";
import { createPool, type PoolOptions } from "mysql2";
import { createConnection } from "mysql2/promise";
import { env } from "../env.js";

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

  await ensureDatabase(name);
  const db = openBillingDatabase(name);
  await db.schema
    .createTable("billing_sales")
    .ifNotExists()
    .addColumn("id", "varchar(80)", (col) => col.primaryKey())
    .addColumn("invoice_number", "varchar(80)", (col) => col.notNull().unique())
    .addColumn("customer_name", "varchar(180)", (col) => col.notNull())
    .addColumn("amount", "double precision", (col) => col.notNull().defaultTo(0))
    .addColumn("currency_code", "varchar(8)", (col) => col.notNull())
    .addColumn("issued_on", "varchar(16)", (col) => col.notNull())
    .addColumn("status", "varchar(24)", (col) => col.notNull())
    .execute();

  await seedSale("sale-001", "SAL-0001", "Northstar Trading", 12500, "INR", "2026-07-08", "confirmed", name);
  await seedSale("sale-002", "SAL-0002", "City Retail", 6400, "INR", "2026-07-08", "draft", name);
  migrated.add(name);
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
        user: env.DB_USER
      } satisfies PoolOptions)
    })
  });
  connections.set(name, db);
  return db;
}

async function seedSale(
  id: string,
  invoiceNumber: string,
  customerName: string,
  amount: number,
  currencyCode: string,
  issuedOn: string,
  status: BillingSalesTable["status"],
  databaseName: string
) {
  await openBillingDatabase(databaseName)
    .insertInto("billing_sales")
    .values({
      amount,
      currency_code: currencyCode,
      customer_name: customerName,
      id,
      invoice_number: invoiceNumber,
      issued_on: issuedOn,
      status
    })
    .onDuplicateKeyUpdate({
      amount,
      currency_code: currencyCode,
      customer_name: customerName,
      issued_on: issuedOn,
      status: sql`status`
    })
    .execute();
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

function assertDatabaseName(value: string) {
  if (!/^[a-zA-Z0-9_]+$/.test(value)) {
    throw new Error(`Invalid database name: ${value}`);
  }
  return value;
}
