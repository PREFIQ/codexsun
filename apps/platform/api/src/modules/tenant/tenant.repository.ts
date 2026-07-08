import type { Tenant, TenantSavePayload } from "./tenant.types.js";
import { sql } from "kysely";
import { getPlatformDatabase } from "../../database/platform-database.js";
import { env } from "../../env.js";

export class TenantRepository {
  async list() {
    const rows = await getPlatformDatabase().selectFrom("tenants").selectAll().orderBy("tenant_name", "asc").execute();
    return rows.map(toTenant);
  }

  async findByIdOrCode(value: string) {
    const normalized = value.trim().toLowerCase();
    const code = normalized.startsWith("tenant-") ? normalized.slice("tenant-".length) : normalized;

    const row = await getPlatformDatabase()
      .selectFrom("tenants")
      .selectAll()
      .where(
        sql<boolean>`
          LOWER(id) = ${normalized}
          OR LOWER(COALESCE(public_id, '')) = ${normalized}
          OR LOWER(tenant_code) = ${normalized}
          OR LOWER(tenant_code) = ${code}
          OR LOWER(slug) = ${code}
          OR LOWER(id) = ${`tenant-${code}`}
          OR LOWER(COALESCE(public_id, '')) = ${`tenant-${code}`}
        `
      )
      .executeTakeFirst();

    return row ? toTenant(row) : null;
  }

  async create(input: TenantSavePayload) {
    const tenant: Tenant = {
      ...input,
      id: `tenant-${input.slug || input.tenantCode.toLowerCase()}`
    };
    await getPlatformDatabase().insertInto("tenants").values(toTenantRow(tenant)).execute();
    await this.upsertTenantDomain(tenant);
    await this.audit(tenant.id, "tenant.created");
    return tenant;
  }

  async update(id: string, input: TenantSavePayload) {
    const existing = await this.findByIdOrCode(id);
    if (!existing) return null;
    const tenant = { ...existing, ...input, id };
    await getPlatformDatabase()
      .updateTable("tenants")
      .set(toTenantRow(tenant))
      .where(sql<boolean>`LOWER(COALESCE(public_id, id)) = ${id.toLowerCase()}`)
      .execute();
    await this.upsertTenantDomain(tenant);
    await this.audit(tenant.id, "tenant.updated");
    return tenant;
  }

  async findByCorporateId(value: string) {
    const corporateId = normalizeIdentity(value);
    if (!corporateId) return null;
    const row = await getPlatformDatabase()
      .selectFrom("tenants")
      .selectAll()
      .where("status", "=", "active")
      .where((eb) =>
        eb.or([
          eb(sql<string>`LOWER(corporate_id)`, "=", corporateId),
          eb(sql<string>`LOWER(tenant_code)`, "=", corporateId),
          eb(sql<string>`LOWER(slug)`, "=", corporateId)
        ])
      )
      .executeTakeFirst();
    return row ? toTenant(row) : null;
  }

  async findByDomain(value: string) {
    const domain = normalizeDomain(value);
    if (!domain) return null;
    const row = await getPlatformDatabase()
      .selectFrom("tenant_domains")
      .innerJoin("tenants", "tenant_domains.tenant_id", "tenants.id")
      .selectAll("tenants")
      .where("tenants.status", "=", "active")
      .where("tenant_domains.domain", "=", domain)
      .executeTakeFirst();
    return row ? toTenant(row) : null;
  }

  async setStatus(id: string, status: Tenant["status"]) {
    const existing = await this.findByIdOrCode(id);
    if (!existing) return null;
    const tenant = { ...existing, status };
    await getPlatformDatabase()
      .updateTable("tenants")
      .set({ status })
      .where(sql<boolean>`LOWER(COALESCE(public_id, id)) = ${tenant.id.toLowerCase()}`)
      .execute();
    await this.audit(tenant.id, status === "active" ? "tenant.restored" : "tenant.suspended");
    return tenant;
  }

  async activity(id: string) {
    const rows = await getPlatformDatabase()
      .selectFrom("tenant_audit_events")
      .select(["id", "actor_email", "event_name", "created_at"])
      .where("tenant_id", "=", id)
      .orderBy("created_at", "desc")
      .orderBy("id", "desc")
      .execute();
    return rows.map((row) => ({
      actor_email: row.actor_email,
      created_at: toIsoDate(row.created_at),
      event_name: row.event_name,
      id: String(row.id)
    }));
  }

  private async audit(tenantId: string, eventName: string) {
    await getPlatformDatabase()
      .insertInto("tenant_audit_events")
      .values({
        actor_email: "system@codexsun.app",
        event_name: eventName,
        tenant_id: tenantId
      })
      .execute();
  }

  private async upsertTenantDomain(tenant: Tenant) {
    const baseDomain = normalizeDomain(env.TENANT_DOMAIN_BASE || "localhost");
    const domain = normalizeDomain(baseDomain === "localhost" ? `${tenant.slug}.localhost` : `${tenant.slug}.${baseDomain}`);
    if (!domain) return;
    await getPlatformDatabase()
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
  }
}

type TenantRow = {
  corporate_id: string | null;
  db_host: string;
  db_name: string;
  db_port: number;
  db_secret_ref: string;
  db_type: string;
  db_user: string;
  default_landing_app: Tenant["defaultLandingApp"];
  enabled_module_keys: string;
  id: number | string;
  mobile: string | null;
  payload_settings: string;
  public_id: string | null;
  slug: string;
  status: Tenant["status"];
  tenant_code: string;
  tenant_name: string;
};

type TenantWriteRow = Omit<TenantRow, "id">;

function toTenantRow(tenant: Tenant): TenantWriteRow {
  return {
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
}

function toTenant(row: TenantRow): Tenant {
  return {
    corporateId: row.corporate_id,
    dbHost: row.db_host,
    dbName: row.db_name,
    dbPort: Number(row.db_port),
    dbSecretRef: row.db_secret_ref,
    dbType: row.db_type,
    dbUser: row.db_user,
    defaultLandingApp: row.default_landing_app,
    enabledModuleKeys: parseStringArray(row.enabled_module_keys),
    id: row.public_id ?? String(row.id),
    mobile: row.mobile,
    payloadSettings: parseRecord(row.payload_settings),
    slug: row.slug,
    status: row.status,
    tenantCode: row.tenant_code,
    tenantName: row.tenant_name
  };
}

function parseStringArray(value: string) {
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed.filter((item): item is string => typeof item === "string") : [];
  } catch {
    return [];
  }
}

function parseRecord(value: string): Record<string, unknown> {
  try {
    const parsed = JSON.parse(value);
    return typeof parsed === "object" && parsed !== null && !Array.isArray(parsed) ? parsed : {};
  } catch {
    return {};
  }
}

function toIsoDate(value: Date | string) {
  return value instanceof Date ? value.toISOString() : new Date(value).toISOString();
}

function normalizeIdentity(value: string) {
  return value.trim().toLowerCase();
}

function normalizeDomain(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//, "")
    .replace(/:\d+$/, "")
    .replace(/^www\./, "");
}
