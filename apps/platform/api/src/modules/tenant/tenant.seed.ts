import { createHash } from "node:crypto";
import { sql, type Kysely } from "kysely";
import { hashPassword } from "../../auth/password-hash.js";
import { getPlatformDatabase } from "../../database/platform-database.js";
import { createTenantDatabase, getTenantDatabase, closeTenantDatabase } from "../../database/tenant-database.js";
import type { TenantDatabase } from "../../database/schema.js";
import { env } from "../../env.js";
import { migrateTenantRuntimeModule } from "./tenant.migration.js";
import { TenantRepository } from "./tenant.repository.js";
import { normalizeTenantDomain } from "../tenant-domain/tenant-domain.repository.js";
import { EntitlementAccessService } from "../entitlement/entitlement.access.js";
import { ensureTenantStorage, tenantPrivateStorageRoot, tenantPublicStorageRoot, tenantStorageRoot } from "../storage-manager/storage-manager.paths.js";
import type { Tenant, TenantSavePayload } from "./tenant.types.js";

export const tenantSeed = {
  records: []
} as const;

export async function provisionTenantDatabase(tenant: Tenant) {
  console.info(`[database] provisioning tenant database "${tenant.dbName}" for tenant "${tenant.tenantCode}"`);
  await createTenantDatabase(tenant.dbName);
  const database = getTenantDatabase(tenant);
  try {
    await migrateTenantRuntimeModule(database);
    await seedTenantRuntimeModule(database, tenant);
    console.info(`[database] tenant database provisioned: "${tenant.dbName}"`);
  } finally {
    await closeTenantDatabase(tenant);
  }
}

export async function provisionTenantStorage(tenant: Tenant) {
  const roots = await ensureTenantStorage(tenant.slug || tenant.tenantCode);
  await getPlatformDatabase()
    .updateTable("tenants")
    .set({
      storage_private_root: roots.privateRoot,
      storage_public_root: roots.publicRoot,
      storage_root: roots.root
    })
    .where("id", "=", tenant.id)
    .execute();
  return roots;
}

export async function seedDefaultTenant() {
  if (env.ENABLE_DEFAULT_TENANT_SEED !== "1") {
    console.info("[seeder] default tenant seed skipped because ENABLE_DEFAULT_TENANT_SEED is not 1");
    return null;
  }

  const input = defaultTenant();
  console.info(`[seeder] default tenant seed started for "${input.tenantCode}"`);
  const repository = new TenantRepository();
  const existing = await repository.findByIdOrCode(input.tenantCode);
  const tenant = existing ?? await repository.create(input);
  if (!tenant) {
    throw new Error("Default tenant seed failed.");
  }
  console.info(`[seeder] default tenant ${existing ? "configuration preserved" : "created"}: ${tenant.tenantCode}`);
  console.info(`[seeder] default tenant domain ready: ${tenant.primaryDomain}`);

  await seedDefaultTenantSubscription(tenant);
  const accessTenant = await new EntitlementAccessService().refreshTenantAccess(tenant.id);
  await provisionTenantStorage(accessTenant ?? tenant);
  await provisionTenantDatabase(accessTenant ?? tenant);
  console.info(`[seeder] default tenant seed completed for "${tenant.tenantCode}"`);
  return accessTenant ?? tenant;
}

export async function seedTenantRuntimeModule(database: Kysely<TenantDatabase>, tenant: Tenant) {
  const enabledKeys = new Set(["platform.application", ...tenant.enabledModuleKeys]);
  const moduleKeys = Array.from(enabledKeys);
  console.info(`[seeder] seeding tenant "${tenant.tenantCode}" app modules (${moduleKeys.length} modules)`);

  await database
    .updateTable("module_settings")
    .set({
      enabled: false,
      updated_at: sql`CURRENT_TIMESTAMP`
    })
    .where("module_key", "not in", moduleKeys)
    .execute();

  for (const moduleKey of moduleKeys) {
    const settingsJson = JSON.stringify({
      defaultLandingApp: tenant.defaultLandingApp,
      tenantCode: tenant.tenantCode
    });

    await database
      .insertInto("module_settings")
      .values({
        enabled: enabledKeys.has(moduleKey),
        module_key: moduleKey,
        settings_json: settingsJson,
        uuid: stableUuid(`${tenant.uuid}:${moduleKey}`)
      })
      .onDuplicateKeyUpdate({
        enabled: enabledKeys.has(moduleKey),
        settings_json: settingsJson,
        updated_at: sql`CURRENT_TIMESTAMP`
      })
      .execute();
    console.info(`[seeder] tenant app module ready: ${moduleKey}`);
  }

  await seedTenantAdmin(database);
  console.info(`[seeder] tenant runtime seed completed for "${tenant.tenantCode}"`);
}

function defaultTenant(): TenantSavePayload {
  const tenantCode = requiredSeedValue("DEFAULT_TENANT_CORPORATE_ID").toUpperCase();
  const slug = normalizeSlug(requiredSeedValue("DEFAULT_TENANT_SLUG"));
  return {
    corporateId: tenantCode,
    dbHost: env.DB_HOST,
    dbName: requiredSeedValue("DEFAULT_TENANT_DB_NAME"),
    dbPort: env.DB_PORT,
    dbSecretRef: "DB_PASSWORD",
    dbType: env.DB_DRIVER,
    dbUser: env.DB_USER,
    defaultLandingApp: "application",
    enabledModuleKeys: ["platform.application"],
    mobile: null,
    payloadSettings: {
      apps: {
        enabled: ["platform.application"]
      },
      landing: {
        app: "application",
        mode: "tenant"
      },
      seed: {
        source: "default-tenant",
        tenantCode
      }
    },
    primaryDomain: defaultTenantDomain(),
    slug,
    status: "active",
    storagePrivateRoot: tenantPrivateStorageRoot(slug),
    storagePublicRoot: tenantPublicStorageRoot(slug),
    storageRoot: tenantStorageRoot(slug),
    tenantCode,
    tenantName: requiredSeedValue("DEFAULT_TENANT_NAME"),
    uuid: stableUuid(tenantCode)
  };
}

async function seedTenantAdmin(database: Kysely<TenantDatabase>) {
  const email = (env.DEFAULT_TENANT_ADMIN_EMAIL || env.TENANT_ADMIN_EMAIL).trim().toLowerCase();
  const password = (env.DEFAULT_TENANT_ADMIN_PASSWORD || env.TENANT_ADMIN_PASSWORD).trim();
  const name = (env.DEFAULT_TENANT_ADMIN_NAME || env.TENANT_ADMIN_NAME).trim() || email;
  if (!email || !password) {
    console.info("[seeder] tenant admin seed skipped because admin email or password is not configured");
    return;
  }

  await database.insertInto("roles").values({ key: "admin", label: "Tenant Administrator", status: "active", uuid: stableUuid("tenant-role:admin") }).onDuplicateKeyUpdate({ label: "Tenant Administrator", status: "active" }).execute();
  const adminRole = await database.selectFrom("roles").select("id").where("key", "=", "admin").executeTakeFirstOrThrow();
  const existing = await database.selectFrom("users").select("id").where("email", "=", email).executeTakeFirst();
  const row = {
    email,
    name,
    password_hash: hashPassword(password),
    role: "admin",
    status: "active" as const,
    updated_at: new Date(),
    uuid: stableUuid(email)
  };

  if (existing) {
    await database.updateTable("users").set(row).where("id", "=", existing.id).execute();
    await database.insertInto("user_roles").values({ role_id: adminRole.id, user_id: existing.id }).ignore().execute();
    console.info(`[seeder] tenant admin updated: ${email}`);
    return;
  }

  const inserted = await database
    .insertInto("users")
    .values({
      ...row
    })
    .executeTakeFirstOrThrow();
  await database.insertInto("user_roles").values({ role_id: adminRole.id, user_id: Number(inserted.insertId) }).ignore().execute();
  console.info(`[seeder] tenant admin created: ${email}`);
}

async function seedDefaultTenantSubscription(tenant: Tenant) {
  const database = getPlatformDatabase();
  const existing = await database
    .selectFrom("subscriptions")
    .select("id")
    .where("tenant_id", "=", tenant.id)
    .where("status", "in", ["active", "trial"])
    .executeTakeFirst();
  if (existing) {
    console.info(`[seeder] default tenant subscription already active for "${tenant.tenantCode}"`);
    return;
  }

  const starterPlan = await database.selectFrom("plans").select(["id", "code"]).where("code", "=", "starter").executeTakeFirst();
  if (!starterPlan) {
    console.info("[seeder] default tenant subscription skipped because starter plan is not available");
    return;
  }

  await database
    .insertInto("subscriptions")
    .values({
      billing_cycle: "monthly",
      ends_on: null,
      plan_id: Number(starterPlan.id),
      starts_on: new Date().toISOString().slice(0, 10),
      status: "trial",
      tenant_id: tenant.id,
      uuid: stableUuid(`subscription:${tenant.uuid}:${starterPlan.code}`)
    })
    .onDuplicateKeyUpdate({
      billing_cycle: "monthly",
      ends_on: null,
      plan_id: Number(starterPlan.id),
      starts_on: new Date().toISOString().slice(0, 10),
      status: "trial",
      tenant_id: tenant.id,
      updated_at: sql`CURRENT_TIMESTAMP`
    })
    .execute();
  console.info(`[seeder] default tenant subscription ready: ${tenant.tenantCode} -> ${starterPlan.code}`);
}

function defaultTenantDomain() {
  const domain = normalizeTenantDomain(env.DEFAULT_TENANT_DOMAIN || "localhost");
  if (!domain) {
    throw new Error("DEFAULT_TENANT_DOMAIN must resolve to a non-empty domain when ENABLE_DEFAULT_TENANT_SEED=1.");
  }

  return domain;
}

function requiredSeedValue(name: "DEFAULT_TENANT_CORPORATE_ID" | "DEFAULT_TENANT_DB_NAME" | "DEFAULT_TENANT_NAME" | "DEFAULT_TENANT_SLUG") {
  const value = env[name].trim();
  if (!value) {
    throw new Error(`${name} is required when ENABLE_DEFAULT_TENANT_SEED=1.`);
  }

  return value;
}

function normalizeSlug(value: string) {
  const slug = value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  if (!slug) {
    throw new Error("DEFAULT_TENANT_SLUG must resolve to a non-empty slug.");
  }

  return slug;
}

function stableUuid(value: string) {
  return createHash("sha256").update(value).digest("hex").slice(0, 8);
}
