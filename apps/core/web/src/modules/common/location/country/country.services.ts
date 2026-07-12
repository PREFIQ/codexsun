import { getTenantDbName, getToken } from "../../../../shared/api/tenant-context";
import { requiredClientEnv } from "../../../../shared/env/client-env";
import type { CountryRecord, CountrySavePayload } from "./country.types";

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

export function listCountryRecords(path: string) {
  return request<CountryRecord[]>(path);
}

export function createCountryRecord(path: string, payload: CountrySavePayload) {
  return request<CountryRecord>(path, { body: JSON.stringify(payload), method: "POST" });
}

export function updateCountryRecord(path: string, id: number, payload: CountrySavePayload) {
  return request<CountryRecord>(`${path}/${id}`, { body: JSON.stringify(payload), method: "PUT" });
}

export function suspendCountryRecord(path: string, id: number) {
  return request<CountryRecord>(`${path}/${id}/deactivate`, { method: "POST" });
}

export function forceDeleteCountryRecord(path: string, id: number) {
  return request<CountryRecord>(`${path}/${id}/force`, { method: "DELETE" });
}
