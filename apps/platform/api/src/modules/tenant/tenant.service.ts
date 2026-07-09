import { TenantRepository } from "./tenant.repository.js";
import type { TenantSavePayload } from "./tenant.types.js";
import { resolveEnabledApps, resolveLandingApp } from "../app-registry/index.js";
import { EntitlementAccessService } from "../entitlement/entitlement.access.js";
import { provisionTenantDatabase, provisionTenantStorage } from "./tenant.seed.js";
import { env } from "../../env.js";
import { defaultTenantDomainForSlug, normalizeTenantDomain } from "../tenant-domain/tenant-domain.repository.js";

export class TenantService {
  constructor(
    private readonly repository = new TenantRepository(),
    private readonly access = new EntitlementAccessService()
  ) {}

  listTenants() {
    return this.repository.list();
  }

  getTenant(value: string) {
    return this.repository.findByIdOrCode(value);
  }

  async getTenantRuntime(value: string) {
    const tenant = await this.getTenant(value);
    const accessTenant = tenant ? await this.access.refreshTenantAccess(tenant.id) : null;
    const runtimeTenant = accessTenant ?? tenant;
    const enabledModuleKeys = runtimeTenant?.enabledModuleKeys ?? ["platform.application"];
    const landingSettings = isRecord(runtimeTenant?.payloadSettings?.landing) ? runtimeTenant?.payloadSettings.landing : {};
    const defaultLandingApp = resolveLandingApp(landingSettings?.app, enabledModuleKeys);
    return {
      apps: resolveEnabledApps(enabledModuleKeys),
      defaultLandingApp,
      tenant: runtimeTenant ?? null
    };
  }

  async createTenant(input: TenantSavePayload) {
    const tenant = await this.repository.create(this.normalize(input));
    await provisionTenantStorage(tenant);
    await provisionTenantDatabase(tenant);
    return tenant;
  }

  async updateTenant(id: string, input: TenantSavePayload) {
    const tenant = await this.repository.update(id, this.normalize(input));
    if (tenant) {
      await provisionTenantStorage(tenant);
      await provisionTenantDatabase(tenant);
    }
    return tenant;
  }

  suspendTenant(id: string) {
    return this.repository.setStatus(id, "suspended");
  }

  restoreTenant(id: string) {
    return this.repository.setStatus(id, "active");
  }

  listActivity(id: string) {
    return this.repository.activity(id);
  }

  private normalize(input: TenantSavePayload): TenantSavePayload {
    const tenantCode = input.tenantCode.trim().toUpperCase();
    const slug = input.slug.trim().toLowerCase() || tenantCode.toLowerCase();
    const legacyKeys = input.enabledModuleKeys.map((key) => (key === "platform.tenant" ? "platform.application" : key));
    const enabledModuleKeys = Array.from(new Set(["platform.application", ...legacyKeys]));
    const incomingPayloadSettings = isRecord(input.payloadSettings) ? input.payloadSettings : {};
    const incomingLanding = isRecord(incomingPayloadSettings.landing) ? incomingPayloadSettings.landing : {};
    const incomingApps = isRecord(incomingPayloadSettings.apps) ? incomingPayloadSettings.apps : {};
    const disabledModuleKeys = parseStringArray(incomingApps.disabled).filter((key) => key !== "platform.application");
    const defaultLandingApp = resolveLandingApp(input.defaultLandingApp ?? incomingLanding.app, enabledModuleKeys);
    return {
      ...input,
      corporateId: input.corporateId?.trim() || null,
      dbHost: input.dbHost.trim() || "127.0.0.1",
      dbName: input.dbName.trim() || `${slug}_db`,
      dbPort: Number(input.dbPort) || 3306,
      dbSecretRef: input.dbSecretRef.trim() || "DB_PASSWORD",
      dbType: input.dbType.trim() || env.DB_DRIVER,
      dbUser: input.dbUser.trim() || env.DB_USER,
      defaultLandingApp,
      enabledModuleKeys,
      mobile: input.mobile?.trim() || null,
      payloadSettings: {
        ...incomingPayloadSettings,
        apps: {
          ...incomingApps,
          disabled: disabledModuleKeys,
          enabled: enabledModuleKeys
        },
        landing: {
          ...incomingLanding,
          app: defaultLandingApp,
          mode: "tenant"
        }
      },
      primaryDomain: normalizeTenantDomain(input.primaryDomain || defaultTenantDomainForSlug(slug)),
      slug,
      status: input.status,
      tenantCode,
      tenantName: input.tenantName.trim()
    };
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function parseStringArray(value: unknown) {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];
}
