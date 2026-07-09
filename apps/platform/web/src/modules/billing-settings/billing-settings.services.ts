import { getTenantDbName } from "../../shared/api/platform-api";
import { requiredClientEnv } from "../../shared/env/client-env";
import type { BillingSettings } from "./billing-settings.types";

const billingApiBaseUrl = requiredClientEnv("VITE_BILLING_API_URL");

type ApiEnvelope<T> =
  | { data: T; success: true }
  | { error: { message: string }; success: false };

export function getBillingSettings() {
  return request<BillingSettings>("/billing/settings", { method: "GET" });
}

export function saveBillingSettings(settings: BillingSettings) {
  return request<BillingSettings>("/billing/settings", {
    body: JSON.stringify(settings),
    method: "PUT",
  });
}

export function getDocumentSettings() {
  return request<BillingSettings["numbering"]>("/billing/document-settings", { method: "GET" });
}

export function saveDocumentSettings(settings: BillingSettings["numbering"]) {
  return request<BillingSettings["numbering"]>("/billing/document-settings", {
    body: JSON.stringify(settings),
    method: "PUT",
  });
}

async function request<T>(path: string, init: RequestInit) {
  const tenantDbName = getTenantDbName();
  const response = await fetch(`${billingApiBaseUrl}${path}`, {
    ...init,
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      ...(tenantDbName ? { "x-tenant-db": tenantDbName } : {}),
      ...(init.headers ?? {}),
    },
  });
  const envelope = (await response.json()) as ApiEnvelope<T>;
  if (!response.ok || !envelope.success) {
    throw new Error(envelope.success ? `Billing API request failed: ${response.status}` : envelope.error.message);
  }
  return envelope.data;
}
