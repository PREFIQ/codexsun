import { TenantRepository } from "./tenant.repository.js";
import type { TenantSavePayload } from "./tenant.types.js";

export class TenantService {
  constructor(private readonly repository = new TenantRepository()) {}

  listTenants() {
    return this.repository.list();
  }

  createTenant(input: TenantSavePayload) {
    return this.repository.create(this.normalize(input));
  }

  updateTenant(id: string, input: TenantSavePayload) {
    return this.repository.update(id, this.normalize(input));
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
    return {
      ...input,
      corporateId: input.corporateId?.trim() || null,
      dbHost: input.dbHost.trim() || "127.0.0.1",
      dbName: input.dbName.trim() || `${slug}_db`,
      dbPort: Number(input.dbPort) || 3306,
      dbSecretRef: input.dbSecretRef.trim() || "TENANT_DB_PASSWORD",
      dbType: input.dbType.trim() || "mariadb",
      dbUser: input.dbUser.trim() || "tenant_user",
      enabledModuleKeys: Array.from(new Set(["platform.tenant", ...input.enabledModuleKeys])),
      mobile: input.mobile?.trim() || null,
      payloadSettings: input.payloadSettings ?? {},
      slug,
      status: input.status,
      tenantCode,
      tenantName: input.tenantName.trim()
    };
  }
}
