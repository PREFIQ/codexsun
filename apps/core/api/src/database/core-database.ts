import { Kysely, MysqlDialect, sql } from "kysely";
import { createPool, type PoolOptions } from "mysql2";
import { createConnection } from "mysql2/promise";
import { env } from "../env.js";

export type CoreDatabase = {
  core_countries: CoreCountriesTable;
};

export type CoreCountriesTable = {
  capital: string | null;
  currency_code: string;
  dial_code: string;
  id: string;
  iso2: string;
  iso3: string;
  name: string;
  numeric_code: string;
  status: "active" | "inactive";
};

let database: Kysely<CoreDatabase> | null = null;

export function getCoreDatabase() {
  if (!database) {
    database = new Kysely<CoreDatabase>({
      dialect: new MysqlDialect({
        pool: createPool({
          database: env.DB_MASTER_NAME,
          host: env.DB_HOST,
          password: env.DB_PASSWORD,
          port: env.DB_PORT,
          timezone: "Z",
          user: env.DB_USER
        } satisfies PoolOptions)
      })
    });
  }

  return database;
}

export async function bootstrapCoreDatabase() {
  await ensureDatabase(env.DB_MASTER_NAME);
  const db = getCoreDatabase();

  await db.schema
    .createTable("core_countries")
    .ifNotExists()
    .addColumn("id", "varchar(80)", (col) => col.primaryKey())
    .addColumn("iso2", "varchar(2)", (col) => col.notNull().unique())
    .addColumn("iso3", "varchar(3)", (col) => col.notNull().unique())
    .addColumn("name", "varchar(160)", (col) => col.notNull())
    .addColumn("numeric_code", "varchar(8)", (col) => col.notNull())
    .addColumn("dial_code", "varchar(16)", (col) => col.notNull())
    .addColumn("currency_code", "varchar(8)", (col) => col.notNull())
    .addColumn("capital", "varchar(120)")
    .addColumn("status", "varchar(24)", (col) => col.notNull())
    .execute();

  await seedCountry("IN", "IND", "India", "356", "+91", "INR", "New Delhi");
  await seedCountry("US", "USA", "United States", "840", "+1", "USD", "Washington, D.C.");
}

async function seedCountry(
  iso2: string,
  iso3: string,
  name: string,
  numericCode: string,
  dialCode: string,
  currencyCode: string,
  capital: string
) {
  await getCoreDatabase()
    .insertInto("core_countries")
    .values({
      capital,
      currency_code: currencyCode,
      dial_code: dialCode,
      id: `country-${iso2.toLowerCase()}`,
      iso2,
      iso3,
      name,
      numeric_code: numericCode,
      status: "active"
    })
    .onDuplicateKeyUpdate({
      capital,
      currency_code: currencyCode,
      dial_code: dialCode,
      iso3,
      name,
      numeric_code: numericCode,
      status: sql`status`
    })
    .execute();
}

async function ensureDatabase(databaseName: string) {
  if (!/^[a-zA-Z0-9_]+$/.test(databaseName)) {
    throw new Error(`Invalid database name: ${databaseName}`);
  }

  const connection = await createConnection({
    host: env.DB_HOST,
    password: env.DB_PASSWORD,
    port: env.DB_PORT,
    timezone: "Z",
    user: env.DB_USER
  });
  try {
    await connection.query(`CREATE DATABASE IF NOT EXISTS \`${databaseName}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
  } finally {
    await connection.end();
  }
}
