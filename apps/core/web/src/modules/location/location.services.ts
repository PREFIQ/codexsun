import { getTenantDbName, getTenantId, getToken } from "../../shared/api/tenant-context"
import { requiredClientEnv } from "../../shared/env/client-env"
import type { LocationRecord, LocationSavePayload } from "./location.types"

const coreApiBaseUrl = requiredClientEnv("VITE_CORE_API_URL")

type ApiEnvelope<T> =
  | { data: T; success: true }
  | { error: { message: string }; success: false }

async function request<T>(path: string, options: RequestInit = {}) {
  const token = getToken("tenant")
  const tenantId = getTenantId()
  const tenantDbName = getTenantDbName()
  const response = await fetch(`${coreApiBaseUrl}${path}`, {
    ...options,
    headers: {
      Accept: "application/json",
      ...(options.body ? { "Content-Type": "application/json" } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(tenantId ? { "x-tenant-id": tenantId } : {}),
      ...(tenantDbName ? { "x-tenant-db": tenantDbName } : {}),
      ...options.headers
    }
  })
  const envelope = (await response.json()) as ApiEnvelope<T>
  if (!response.ok || !envelope.success) {
    throw new Error(envelope.success ? "Core API request failed." : envelope.error.message)
  }
  return envelope.data
}

export function listLocationRecords(path: string) {
  return request<LocationRecord[]>(path)
}

export function createLocationRecord(path: string, payload: LocationSavePayload) {
  return request<LocationRecord>(path, { body: JSON.stringify(payload), method: "POST" })
}

export function updateLocationRecord(path: string, id: string, payload: LocationSavePayload) {
  return request<LocationRecord>(`${path}/${id}`, { body: JSON.stringify(payload), method: "PUT" })
}

export function suspendLocationRecord(path: string, id: string) {
  return request<LocationRecord>(`${path}/${id}/deactivate`, { method: "POST" })
}

export function forceDeleteLocationRecord(path: string, id: string) {
  return request<LocationRecord>(`${path}/${id}/force`, { method: "DELETE" })
}
