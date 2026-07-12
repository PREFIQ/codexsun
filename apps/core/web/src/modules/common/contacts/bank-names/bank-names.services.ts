import { getTenantDbName, getToken } from "../../../../shared/api/tenant-context";
import { requiredClientEnv } from "../../../../shared/env/client-env";
import type { BankNamesRecord, BankNamesValue } from "./bank-names.types";

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

export function listBankNames(path: string) {
  return request<BankNamesRecord[]>(path);
}
export function createBankNames(path: string, payload: Record<string, BankNamesValue>) {
  return request<BankNamesRecord>(path, { body: JSON.stringify(payload), method: "POST" });
}
export function updateBankNames(path: string, id: number, payload: Record<string, BankNamesValue>) {
  return request<BankNamesRecord>(`${path}/${id}`, {
    body: JSON.stringify(payload),
    method: "PUT"
  });
}
export function setBankNamesActive(path: string, id: number, active: boolean) {
  return request<BankNamesRecord>(`${path}/${id}/${active ? "activate" : "deactivate"}`, {
    method: "POST"
  });
}
export function forceDeleteBankNames(path: string, id: number) {
  return request<BankNamesRecord>(`${path}/${id}/force`, { method: "DELETE" });
}
