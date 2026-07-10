import { getTenantDbName, getTenantId, getToken } from "../../shared/api/tenant-context";
import { requiredClientEnv } from "../../shared/env/client-env";
import type { CommonMasterRecord, EntryContactRecord, EntryKind, EntryProductRecord, EntryRecord } from "./entries.types";

const billingApiBaseUrl = requiredClientEnv("VITE_BILLING_API_URL");

type Envelope<T> = { data: T; success: true } | { error: { message: string }; success: false };

function entryCollectionPath(kind: EntryKind) {
  if (kind === "quotation") return "quotations";
  if (kind === "sales") return "sales";
  if (kind === "purchase") return "purchases";
  return "export-sales";
}

async function request<T>(path: string, options: RequestInit = {}) {
  const token = getToken("tenant");
  const tenantId = getTenantId();
  const tenantDbName = getTenantDbName();
  const response = await fetch(`${billingApiBaseUrl}${path}`, {
    ...options,
    headers: {
      Accept: "application/json",
      ...(options.body ? { "Content-Type": "application/json" } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(tenantId ? { "x-tenant-id": tenantId } : {}),
      ...(tenantDbName ? { "x-tenant-db": tenantDbName } : {}),
      ...options.headers
    }
  });
  const envelope = (await response.json()) as Envelope<T>;
  if (!response.ok || !envelope.success) throw new Error(envelope.success ? "Billing API request failed." : envelope.error.message);
  return envelope.data;
}

export function listEntryRecords(kind: EntryKind, search = "") {
  return request<EntryRecord[]>(`/billing/entries/${entryCollectionPath(kind)}?search=${encodeURIComponent(search)}`);
}

export function getEntryRecord(kind: EntryKind, id: string) {
  return request<EntryRecord>(`/billing/entries/${entryCollectionPath(kind)}/${id}`);
}

export function createEntryRecord(kind: EntryKind, payload: Record<string, unknown>) {
  return request<EntryRecord>(`/billing/entries/${entryCollectionPath(kind)}`, { body: JSON.stringify(payload), method: "POST" });
}

export function updateEntryRecord(kind: EntryKind, id: string, payload: Record<string, unknown>) {
  return request<EntryRecord>(`/billing/entries/${entryCollectionPath(kind)}/${id}`, { body: JSON.stringify(payload), method: "PUT" });
}

export function setEntryRecordActive(kind: EntryKind, id: string, active: boolean) {
  return request<EntryRecord>(`/billing/entries/${entryCollectionPath(kind)}/${id}/${active ? "activate" : "deactivate"}`, { method: "POST" });
}

export function addEntryComment(kind: EntryKind, id: string, body: string) {
  return request<EntryRecord>(`/billing/entries/${entryCollectionPath(kind)}/${id}/comments`, { body: JSON.stringify({ body }), method: "POST" });
}

export function convertQuotationsToSales(quotationIds: string[]) {
  return request<EntryRecord>("/billing/entries/quotations/convert-to-sales", { body: JSON.stringify({ quotationIds }), method: "POST" });
}

export function listEntryContacts() {
  return request<EntryContactRecord[]>("/billing/entries/support/contacts");
}

export function createEntryContact(payload: Record<string, unknown>) {
  return request<EntryContactRecord>("/billing/entries/support/contacts", { body: JSON.stringify(payload), method: "POST" });
}

export function updateEntryContact(id: string, payload: Record<string, unknown>) {
  return request<EntryContactRecord>(`/billing/entries/support/contacts/${id}`, { body: JSON.stringify(payload), method: "PUT" });
}

export function listEntryProducts() {
  return request<EntryProductRecord[]>("/billing/entries/support/products");
}

export function createEntryProduct(payload: Record<string, unknown>) {
  return request<EntryProductRecord>("/billing/entries/support/products", { body: JSON.stringify(payload), method: "POST" });
}

export function updateEntryProduct(id: string, payload: Record<string, unknown>) {
  return request<EntryProductRecord>(`/billing/entries/support/products/${id}`, { body: JSON.stringify(payload), method: "PUT" });
}

export function listCommonMasterOptions(path: string) {
  return request<CommonMasterRecord[]>(path);
}

export function createCommonMasterOption(path: string, payload: Record<string, unknown>) {
  return request<CommonMasterRecord>(path, { body: JSON.stringify(payload), method: "POST" });
}
