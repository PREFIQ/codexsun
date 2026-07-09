import { getTenantId, getToken } from "../../shared/api/platform-api"
import type { LocationRecord, LocationSavePayload } from "./location.types"

const coreApiBaseUrl = import.meta.env.VITE_CORE_API_URL || "http://127.0.0.1:5530"

type ApiEnvelope<T> =
  | { data: T; success: true }
  | { error: { message: string }; success: false }

async function request<T>(path: string, options: RequestInit = {}) {
  const token = getToken("tenant")
  const tenantId = getTenantId()
  const response = await fetch(`${coreApiBaseUrl}${path}`, {
    ...options,
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(tenantId ? { "x-tenant-id": tenantId } : {}),
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
