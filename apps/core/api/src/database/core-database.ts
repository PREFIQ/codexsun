import { Kysely, MysqlDialect } from "kysely";
import { createPool, type PoolOptions } from "mysql2";
import { createConnection } from "mysql2/promise";
import { env } from "../env.js";
import { migrateCountryModule } from "../modules/country/country.migration.js";
import { seedCountryModule } from "../modules/country/country.seed.js";

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

  await migrateCountryModule(db);
  await seedCountryModule(db);
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
