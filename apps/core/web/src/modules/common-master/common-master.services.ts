import { getTenantId, getToken } from "../../shared/api/tenant-context";
import { requiredClientEnv } from "../../shared/env/client-env";
import type { CommonMasterRecord, CommonMasterValue } from "./common-master.types";

const baseUrl = requiredClientEnv("VITE_CORE_API_URL");
type Envelope<T> = { data: T; success: true } | { error: { message: string }; success: false };

async function request<T>(path: string, options: RequestInit = {}) {
  const token = getToken("tenant");
  const tenantId = getTenantId();
  const response = await fetch(`${baseUrl}${path}`, {
    ...options,
    headers: {
      ...(options.body ? { "Content-Type": "application/json" } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(tenantId ? { "x-tenant-id": tenantId } : {}),
      ...options.headers
    }
  });
  const body = await response.json() as Envelope<T>;
  if (!response.ok || !body.success) throw new Error(body.success ? "Request failed." : body.error.message);
  return body.data;
}

export function listCommonMaster(path: string) { return request<CommonMasterRecord[]>(path); }
export function createCommonMaster(path: string, payload: Record<string, CommonMasterValue>) {
  return request<CommonMasterRecord>(path, { body: JSON.stringify(payload), method: "POST" });
}
export function updateCommonMaster(path: string, id: string, payload: Record<string, CommonMasterValue>) {
  return request<CommonMasterRecord>(`${path}/${id}`, { body: JSON.stringify(payload), method: "PUT" });
}
export function setCommonMasterActive(path: string, id: string, active: boolean) {
  return request<CommonMasterRecord>(`${path}/${id}/${active ? "activate" : "deactivate"}`, { method: "POST" });
}
export function forceDeleteCommonMaster(path: string, id: string) {
  return request<CommonMasterRecord>(`${path}/${id}/force`, { method: "DELETE" });
}
