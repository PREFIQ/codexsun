import { getTenantDbName, getToken } from "../../../../shared/api/tenant-context";
import { requiredClientEnv } from "../../../../shared/env/client-env";
import type { PaymentTermsRecord, PaymentTermsValue } from "./payment-terms.types";

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

export function listPaymentTerms(path: string) {
  return request<PaymentTermsRecord[]>(path);
}
export function createPaymentTerms(path: string, payload: Record<string, PaymentTermsValue>) {
  return request<PaymentTermsRecord>(path, { body: JSON.stringify(payload), method: "POST" });
}
export function updatePaymentTerms(
  path: string,
  id: number,
  payload: Record<string, PaymentTermsValue>
) {
  return request<PaymentTermsRecord>(`${path}/${id}`, {
    body: JSON.stringify(payload),
    method: "PUT"
  });
}
export function setPaymentTermsActive(path: string, id: number, active: boolean) {
  return request<PaymentTermsRecord>(`${path}/${id}/${active ? "activate" : "deactivate"}`, {
    method: "POST"
  });
}
export function forceDeletePaymentTerms(path: string, id: number) {
  return request<PaymentTermsRecord>(`${path}/${id}/force`, { method: "DELETE" });
}
