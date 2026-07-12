import { getTenantDbName, getToken } from "../../../../shared/api/tenant-context";
import { requiredClientEnv } from "../../../../shared/env/client-env";
import type { PrioritiesRecord, PrioritiesValue } from "./priorities.types";

const baseUrl = requiredClientEnv("VITE_CORE_API_URL");
type Envelope<T> = { data: T; success: true } | { error: { message: string }; success: false };

async function request<T>(path: string, options: RequestInit = {}) {
  const token = getToken("tenant");
  const tenantDbName = getTenantDbName();
  const response = await fetch(`${baseUrl}${path}`, {
    ...options,
    headers: {
      ...(options.body ? { "Content-Type": "application/json" } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(tenantDbName ? { "x-tenant-db": tenantDbName } : {}),
      ...options.headers
    }
  });
  const body = (await response.json()) as Envelope<T>;
  if (!response.ok || !body.success)
    throw new Error(body.success ? "Request failed." : body.error.message);
  return body.data;
}

export function listPriorities(path: string) {
  return request<PrioritiesRecord[]>(path);
}
export function createPriorities(path: string, payload: Record<string, PrioritiesValue>) {
  return request<PrioritiesRecord>(path, { body: JSON.stringify(payload), method: "POST" });
}
export function updatePriorities(
  path: string,
  id: number,
  payload: Record<string, PrioritiesValue>
) {
  return request<PrioritiesRecord>(`${path}/${id}`, {
    body: JSON.stringify(payload),
    method: "PUT"
  });
}
export function setPrioritiesActive(path: string, id: number, active: boolean) {
  return request<PrioritiesRecord>(`${path}/${id}/${active ? "activate" : "deactivate"}`, {
    method: "POST"
  });
}
export function forceDeletePriorities(path: string, id: number) {
  return request<PrioritiesRecord>(`${path}/${id}/force`, { method: "DELETE" });
}
