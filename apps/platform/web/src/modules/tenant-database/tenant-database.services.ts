import { apiGet, apiPost } from "../../shared/api/platform-api";
import type { DatabaseMaintenanceRun, TenantDatabaseActionPayload, TenantDatabaseStatus } from "./tenant-database.types";

export function listTenantDatabaseStatus() {
  return apiGet<TenantDatabaseStatus[]>("/admin/database/tenants", "sa");
}

export function migrateTenantDatabase(tenantId: number, payload: TenantDatabaseActionPayload) {
  return apiPost<DatabaseMaintenanceRun>(`/admin/database/tenants/${tenantId}/migrate`, payload, "sa");
}

export function requestTenantDatabaseBackup(tenantId: number, payload: TenantDatabaseActionPayload) {
  return apiPost<DatabaseMaintenanceRun>(`/admin/database/tenants/${tenantId}/backup`, payload, "sa");
}

export function requestTenantDatabaseRestore(tenantId: number, payload: TenantDatabaseActionPayload) {
  return apiPost<DatabaseMaintenanceRun>(`/admin/database/tenants/${tenantId}/restore`, payload, "sa");
}
