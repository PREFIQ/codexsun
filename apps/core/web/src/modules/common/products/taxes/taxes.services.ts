import { getTenantDbName, getToken } from "../../../../shared/api/tenant-context";
import { requiredClientEnv } from "../../../../shared/env/client-env";
import type { TaxesRecord, TaxesValue } from "./taxes.types";

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

export function listTaxes(path: string) {
  return request<TaxesRecord[]>(path);
}
export function createTaxes(path: string, payload: Record<string, TaxesValue>) {
  return request<TaxesRecord>(path, { body: JSON.stringify(payload), method: "POST" });
}
export function updateTaxes(path: string, id: number, payload: Record<string, TaxesValue>) {
  return request<TaxesRecord>(`${path}/${id}`, { body: JSON.stringify(payload), method: "PUT" });
}
export function setTaxesActive(path: string, id: number, active: boolean) {
  return request<TaxesRecord>(`${path}/${id}/${active ? "activate" : "deactivate"}`, {
    method: "POST"
  });
}
export function forceDeleteTaxes(path: string, id: number) {
  return request<TaxesRecord>(`${path}/${id}/force`, { method: "DELETE" });
}
