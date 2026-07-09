import { Kysely, MysqlDialect } from "kysely";
import { createPool, type PoolOptions } from "mysql2";
import { createConnection } from "mysql2/promise";
import { env } from "../env.js";
import { migrateCommonModule } from "../modules/common/common.migration.js";
import { seedCommonModule } from "../modules/common/common.seed.js";
import { migrateEntriesModule } from "../modules/entries/index.js";

export type CoreDatabase = Record<string, unknown>;

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

export async function closeCoreDatabase() {
  if (!database) return;
  await database.destroy();
  database = null;
}

export async function bootstrapCoreDatabase() {
  await ensureDatabase(env.DB_MASTER_NAME);
  const db = getCoreDatabase();

  await migrateCommonModule(db);
  await migrateEntriesModule(db);
  await seedCommonModule();
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
