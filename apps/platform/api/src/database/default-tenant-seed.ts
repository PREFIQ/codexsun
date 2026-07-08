import { sql } from "kysely";
import { env } from "../env.js";
import type { Tenant } from "../modules/tenant/tenant.types.js";
import { getPlatformDatabase } from "./platform-database.js";
import { provisionTenantDatabase } from "./tenant-database.js";

export async function seedDefaultTenant() {
  if (env.ENABLE_DEFAULT_TENANT_SEED !== "1") {
    console.info("[seeder] default tenant seed skipped because ENABLE_DEFAULT_TENANT_SEED is not 1");
    return null;
  }

  const tenant = defaultTenant();
  console.info(`[seeder] default tenant seed started for "${tenant.tenantCode}"`);
  const database = getPlatformDatabase();
  const existing = await database
    .selectFrom("tenants")
    .select(["id", "public_id"])
    .where((eb) =>
      eb.or([
        eb(sql<string>`LOWER(COALESCE(public_id, ''))`, "=", tenant.id.toLowerCase()),
        eb(sql<string>`LOWER(tenant_code)`, "=", tenant.tenantCode.toLowerCase()),
        eb(sql<string>`LOWER(COALESCE(corporate_id, ''))`, "=", String(tenant.corporateId).toLowerCase()),
        eb(sql<string>`LOWER(slug)`, "=", tenant.slug.toLowerCase())
      ])
    )
    .executeTakeFirst();

  const row = {
    corporate_id: tenant.corporateId,
    db_host: tenant.dbHost,
    db_name: tenant.dbName,
    db_port: tenant.dbPort,
    db_secret_ref: tenant.dbSecretRef,
    db_type: tenant.dbType,
    db_user: tenant.dbUser,
    default_landing_app: tenant.defaultLandingApp,
    enabled_module_keys: JSON.stringify(tenant.enabledModuleKeys),
    mobile: tenant.mobile,
    payload_settings: JSON.stringify(tenant.payloadSettings),
    public_id: tenant.id,
    slug: tenant.slug,
    status: tenant.status,
    tenant_code: tenant.tenantCode,
    tenant_name: tenant.tenantName
  };

  if (existing) {
    await database.updateTable("tenants").set(row).where("id", "=", existing.id).execute();
    console.info(`[seeder] default tenant updated: ${tenant.tenantCode}`);
  } else {
    await database.insertInto("tenants").values(row).execute();
    console.info(`[seeder] default tenant created: ${tenant.tenantCode}`);
  }

  const domain = defaultTenantDomain();
  await database
    .insertInto("tenant_domains")
    .values({
      domain,
      is_primary: true,
      tenant_id: tenant.id
    })
    .onDuplicateKeyUpdate({
      is_primary: true,
      tenant_id: tenant.id
    })
    .execute();
  console.info(`[seeder] default tenant domain ready: ${domain}`);

  await provisionTenantDatabase(tenant);
  console.info(`[seeder] default tenant seed completed for "${tenant.tenantCode}"`);
  return tenant;
}

function defaultTenant(): Tenant {
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
    id: `tenant-${slug}`,
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
    slug,
    status: "active",
    tenantCode,
    tenantName: requiredSeedValue("DEFAULT_TENANT_NAME")
  };
}

function defaultTenantDomain() {
  const domain = normalizeDomain(env.DEFAULT_TENANT_DOMAIN || "localhost");
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

function normalizeDomain(value: string) {
  return value.trim().toLowerCase().replace(/^https?:\/\//, "").replace(/\/.*$/, "").replace(/:\d+$/, "");
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
