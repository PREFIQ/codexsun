import { getTenantId, getToken } from "../../shared/api/tenant-context";
import { requiredClientEnv } from "../../shared/env/client-env";
import type { MasterDefinition, MasterRecord, MasterSavePayload } from "./master.types";

export type MasterLookupRecord = {
  areaName?: string | null;
  cityId?: string | null;
  cityName?: string | null;
  code?: string | null;
  countryId?: string | null;
  countryName?: string | null;
  districtId?: string | null;
  districtName?: string | null;
  description?: string | null;
  id: string;
  name?: string | null;
  pincode?: string | null;
  ratePercent?: number | null;
  stateId?: string | null;
  stateName?: string | null;
};

const coreApiBaseUrl = requiredClientEnv("VITE_CORE_API_URL");

type Envelope<T> = { data: T; success: true } | { error: { message: string }; success: false };

async function request<T>(path: string, options: RequestInit = {}) {
  const token = getToken("tenant");
  const tenantId = getTenantId();
  const response = await fetch(`${coreApiBaseUrl}${path}`, {
    ...options,
    headers: {
      Accept: "application/json",
      ...(options.body ? { "Content-Type": "application/json" } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(tenantId ? { "x-tenant-id": tenantId } : {}),
      ...options.headers
    }
  });
  const envelope = (await response.json()) as Envelope<T>;
  if (!response.ok || !envelope.success) throw new Error(envelope.success ? "Core API request failed." : envelope.error.message);
  return envelope.data;
}

export function listMasterRecords(definition: MasterDefinition, search = "") {
  return request<MasterRecord[]>(`${masterEndpoint(definition)}?search=${encodeURIComponent(search)}`);
}

export function createMasterRecord(definition: MasterDefinition, payload: MasterSavePayload) {
  return request<MasterRecord>(masterEndpoint(definition), { body: JSON.stringify(payload), method: "POST" });
}

export function updateMasterRecord(definition: MasterDefinition, id: string, payload: MasterSavePayload) {
  return request<MasterRecord>(`${masterEndpoint(definition)}/${id}`, { body: JSON.stringify(payload), method: "PUT" });
}

export function setMasterRecordActive(definition: MasterDefinition, id: string, active: boolean) {
  return request<MasterRecord>(`${masterEndpoint(definition)}/${id}/${active ? "activate" : "deactivate"}`, { method: "POST" });
}

export function forceDeleteMasterRecord(definition: MasterDefinition, id: string) {
  return request<MasterRecord>(`${masterEndpoint(definition)}/${id}/force`, { method: "DELETE" });
}

export function listMasterLookup(path: string) {
  return request<MasterLookupRecord[]>(path);
}

function masterEndpoint(definition: MasterDefinition) {
  return definition.apiPath ?? `/core/master/${definition.route}`;
}
