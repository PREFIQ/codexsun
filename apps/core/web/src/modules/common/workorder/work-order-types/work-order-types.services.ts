import { getTenantDbName, getToken } from "../../../../shared/api/tenant-context";
import { requiredClientEnv } from "../../../../shared/env/client-env";
import type { WorkOrderTypesRecord, WorkOrderTypesValue } from "./work-order-types.types";

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

export function listWorkOrderTypes(path: string) {
  return request<WorkOrderTypesRecord[]>(path);
}
export function createWorkOrderTypes(path: string, payload: Record<string, WorkOrderTypesValue>) {
  return request<WorkOrderTypesRecord>(path, { body: JSON.stringify(payload), method: "POST" });
}
export function updateWorkOrderTypes(
  path: string,
  id: number,
  payload: Record<string, WorkOrderTypesValue>
) {
  return request<WorkOrderTypesRecord>(`${path}/${id}`, {
    body: JSON.stringify(payload),
    method: "PUT"
  });
}
export function setWorkOrderTypesActive(path: string, id: number, active: boolean) {
  return request<WorkOrderTypesRecord>(`${path}/${id}/${active ? "activate" : "deactivate"}`, {
    method: "POST"
  });
}
export function forceDeleteWorkOrderTypes(path: string, id: number) {
  return request<WorkOrderTypesRecord>(`${path}/${id}/force`, { method: "DELETE" });
}
