import { getTenantDbName, getToken } from "../../../../shared/api/tenant-context";
import { requiredClientEnv } from "../../../../shared/env/client-env";
import type { DistrictRecord, DistrictSavePayload } from "./district.types";

const coreApiBaseUrl = requiredClientEnv("VITE_CORE_API_URL");

type ApiEnvelope<T> = { data: T; success: true } | { error: { message: string }; success: false };

async function request<T>(path: string, options: RequestInit = {}) {
  const token = getToken("tenant");
  const tenantDbName = getTenantDbName();
  const response = await fetch(`${coreApiBaseUrl}${path}`, {
    ...options,
    headers: {
      Accept: "application/json",
      ...(options.body ? { "Content-Type": "application/json" } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(tenantDbName ? { "x-tenant-db": tenantDbName } : {}),
      ...options.headers
    }
  });
  const envelope = (await response.json()) as ApiEnvelope<T>;
  if (!response.ok || !envelope.success) {
    throw new Error(envelope.success ? "Core API request failed." : envelope.error.message);
  }
  return envelope.data;
}

export function listDistrictRecords(path: string) {
  return request<DistrictRecord[]>(path);
}

export function createDistrictRecord(path: string, payload: DistrictSavePayload) {
  return request<DistrictRecord>(path, { body: JSON.stringify(payload), method: "POST" });
}

export function updateDistrictRecord(path: string, id: number, payload: DistrictSavePayload) {
  return request<DistrictRecord>(`${path}/${id}`, { body: JSON.stringify(payload), method: "PUT" });
}

export function suspendDistrictRecord(path: string, id: number) {
  return request<DistrictRecord>(`${path}/${id}/deactivate`, { method: "POST" });
}

export function forceDeleteDistrictRecord(path: string, id: number) {
  return request<DistrictRecord>(`${path}/${id}/force`, { method: "DELETE" });
}
