import { Kysely, MysqlDialect, sql } from "kysely";
import { createPool, type PoolOptions } from "mysql2";
import { createConnection } from "mysql2/promise";
import { env } from "../env.js";
import { hashPassword } from "../auth/password-hash.js";
import type { Tenant } from "../modules/tenant/tenant.types.js";
import { assertDatabaseName, quoteIdentifier } from "./database-utils.js";
import type { TenantDatabase } from "./schema.js";

const tenantConnections = new Map<string, Kysely<TenantDatabase>>();

export async function provisionTenantDatabase(tenant: Tenant) {
  await createTenantDatabase(tenant.dbName);
  const database = getTenantDatabase(tenant);
  await migrateTenantDatabase(database);
  await seedTenantDatabase(database, tenant);
}

export async function createTenantDatabase(databaseName: string) {
  const name = assertDatabaseName(databaseName, "tenant database name");
  const connection = await createConnection({
    host: env.DB_HOST,
    password: env.DB_PASSWORD,
    port: env.DB_PORT,
    user: env.DB_USER,
    timezone: "Z"
  });
  try {
    await connection.query(
      `CREATE DATABASE IF NOT EXISTS ${quoteIdentifier(name)} CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`
    );
  } finally {
    await connection.end();
  }
}

export function getTenantDatabase(tenant: Tenant) {
  const key = tenant.slug || tenant.dbName;
  const existing = tenantConnections.get(key);
  if (existing) {
    return existing;
  }

  const database = new Kysely<TenantDatabase>({
    dialect: new MysqlDialect({
      pool: createPool({
        database: assertDatabaseName(tenant.dbName, "tenant database name"),
        connectionLimit: 10,
        host: tenant.dbHost || env.DB_HOST,
        password: env.DB_PASSWORD,
        port: tenant.dbPort || env.DB_PORT,
        timezone: "Z",
        user: tenant.dbUser || env.DB_USER
      } satisfies PoolOptions)
    })
  });

  tenantConnections.set(key, database);
  return database;
}

export async function closeTenantDatabase(tenant: Tenant) {
  const key = tenant.slug || tenant.dbName;
  const existing = tenantConnections.get(key);
  if (!existing) {
    return;
  }

  tenantConnections.delete(key);
  await existing.destroy();
}

export async function dropTenantDatabase(tenant: Tenant) {
  await closeTenantDatabase(tenant);
  const connection = await createConnection({
    host: tenant.dbHost || env.DB_HOST,
    password: env.DB_PASSWORD,
    port: tenant.dbPort || env.DB_PORT,
    user: tenant.dbUser || env.DB_USER,
    timezone: "Z"
  });
  try {
    await connection.query(`DROP DATABASE IF EXISTS ${quoteIdentifier(tenant.dbName)}`);
  } finally {
    await connection.end();
  }
}

export async function migrateTenantDatabase(database: Kysely<TenantDatabase>) {
  await database.schema
    .createTable("tenant_migrations")
    .ifNotExists()
    .addColumn("id", "integer", (col) => col.primaryKey().autoIncrement())
    .addColumn("name", "varchar(160)", (col) => col.notNull().unique())
    .addColumn("applied_at", "datetime", (col) => col.notNull().defaultTo(sql`CURRENT_TIMESTAMP`))
    .execute();

  await database.schema
    .createTable("tenant_module_settings")
    .ifNotExists()
    .addColumn("id", "integer", (col) => col.primaryKey().autoIncrement())
    .addColumn("module_key", "varchar(160)", (col) => col.notNull().unique())
    .addColumn("enabled", "boolean", (col) => col.notNull().defaultTo(false))
    .addColumn("settings_json", "json", (col) => col.notNull())
    .addColumn("created_at", "datetime", (col) => col.notNull().defaultTo(sql`CURRENT_TIMESTAMP`))
    .addColumn("updated_at", "datetime", (col) => col.notNull().defaultTo(sql`CURRENT_TIMESTAMP`))
    .execute();

  await database.schema
    .createTable("tenant_users")
    .ifNotExists()
    .addColumn("id", "varchar(80)", (col) => col.primaryKey())
    .addColumn("name", "varchar(180)", (col) => col.notNull())
    .addColumn("email", "varchar(180)", (col) => col.notNull().unique())
    .addColumn("password_hash", "varchar(255)", (col) => col.notNull())
    .addColumn("role", "varchar(80)", (col) => col.notNull())
    .addColumn("status", "varchar(24)", (col) => col.notNull().defaultTo("active"))
    .addColumn("created_at", "datetime", (col) => col.notNull().defaultTo(sql`CURRENT_TIMESTAMP`))
    .addColumn("updated_at", "datetime", (col) => col.notNull().defaultTo(sql`CURRENT_TIMESTAMP`))
    .execute();

  await database.insertInto("tenant_migrations").ignore().values({ name: "001_tenant_foundation" }).execute();
}

export async function seedTenantDatabase(database: Kysely<TenantDatabase>, tenant: Tenant) {
  const enabledKeys = new Set(["platform.application", ...tenant.enabledModuleKeys]);
  const moduleKeys = Array.from(enabledKeys);
  for (const moduleKey of moduleKeys) {
    const settingsJson = JSON.stringify({
      defaultLandingApp: tenant.defaultLandingApp,
      tenantCode: tenant.tenantCode
    });

    await database
      .insertInto("tenant_module_settings")
      .values({
        enabled: enabledKeys.has(moduleKey),
        module_key: moduleKey,
        settings_json: settingsJson
      })
      .onDuplicateKeyUpdate({
        enabled: enabledKeys.has(moduleKey),
        settings_json: settingsJson,
        updated_at: sql`CURRENT_TIMESTAMP`
      })
      .execute();
  }

  await seedTenantAdmin(database);
}

async function seedTenantAdmin(database: Kysely<TenantDatabase>) {
  const email = (env.DEFAULT_TENANT_ADMIN_EMAIL || env.TENANT_ADMIN_EMAIL).trim().toLowerCase();
  const password = (env.DEFAULT_TENANT_ADMIN_PASSWORD || env.TENANT_ADMIN_PASSWORD).trim();
  const name = (env.DEFAULT_TENANT_ADMIN_NAME || env.TENANT_ADMIN_NAME).trim() || email;
  if (!email || !password) {
    return;
  }

  const userId = `tenant-user-${email.replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "")}`;
  const existing = await database.selectFrom("tenant_users").select("id").where("email", "=", email).executeTakeFirst();
  const row = {
    email,
    name,
    password_hash: hashPassword(password),
    role: "admin",
    status: "active" as const,
    updated_at: new Date()
  };

  if (existing) {
    await database.updateTable("tenant_users").set(row).where("id", "=", existing.id).execute();
    return;
  }

  await database
    .insertInto("tenant_users")
    .values({
      ...row,
      id: userId
    })
    .execute();
}
