import { apiGet, apiPost, apiPut } from "../../shared/api/platform-api";
import type { AuditEventDTO, Tenant, TenantRuntime, TenantSavePayload } from "./tenant.types";

export function listTenants() {
  return apiGet<Tenant[]>("/admin/tenants", "sa");
}

export function createTenant(tenant: TenantSavePayload) {
  return apiPost<Tenant>("/admin/tenants", tenant, "sa");
}

export function updateTenant(tenant: TenantSavePayload & { id: string }) {
  return apiPut<Tenant>(`/admin/tenants/${tenant.id}`, tenant, "sa");
}

export function suspendTenant(id: string) {
  return apiPost<Tenant>(`/admin/tenants/${id}/suspend`, {}, "sa");
}

export function restoreTenant(id: string) {
  return apiPost<Tenant>(`/admin/tenants/${id}/restore`, {}, "sa");
}

export function listTenantActivity(id: string) {
  return apiGet<AuditEventDTO[]>(`/admin/activity/tenant/${id}`, "sa");
}

export function getTenantRuntime() {
  return apiGet<TenantRuntime>("/tenant/runtime", "tenant");
}
