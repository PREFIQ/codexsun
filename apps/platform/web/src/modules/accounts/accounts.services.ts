import { getTenantDbName, getTenantId, getToken } from "../../shared/api/platform-api";
import { requiredClientEnv } from "../../shared/env/client-env";
import type { AccountGroup, AccountsReportsOverview, AccountsSettings, Ledger, LedgerSavePayload, Voucher, VoucherSavePayload } from "./accounts.types";

const accountsApiBaseUrl = requiredClientEnv("VITE_ACCOUNTS_API_URL");

type Envelope<T> = { data: T; success: true } | { error: { message: string }; success: false };

async function request<T>(path: string, options: RequestInit = {}) {
  const token = getToken("tenant");
  const tenantDbName = getTenantDbName();
  const tenantId = getTenantId();
  const response = await fetch(`${accountsApiBaseUrl}${path}`, {
    ...options,
    headers: {
      Accept: "application/json",
      ...(options.body ? { "Content-Type": "application/json" } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(tenantDbName ? { "x-tenant-db": tenantDbName } : {}),
      ...(tenantId ? { "x-tenant-id": tenantId } : {}),
      ...options.headers
    }
  });
  const envelope = (await response.json()) as Envelope<T>;
  if (!response.ok || !envelope.success) throw new Error(envelope.success ? "Accounts API request failed." : envelope.error.message);
  return envelope.data;
}

export function listAccountGroups() {
  return request<AccountGroup[]>("/accounts/groups");
}

export function listLedgers(search = "") {
  return request<Ledger[]>(`/accounts/ledgers?search=${encodeURIComponent(search)}`);
}

export function createLedger(payload: LedgerSavePayload) {
  return request<Ledger>("/accounts/ledgers", { body: JSON.stringify(payload), method: "POST" });
}

export function updateLedger(id: string, payload: LedgerSavePayload) {
  return request<Ledger>(`/accounts/ledgers/${id}`, { body: JSON.stringify(payload), method: "PUT" });
}

export function listVouchers(search = "") {
  return request<Voucher[]>(`/accounts/vouchers?search=${encodeURIComponent(search)}`);
}

export function createVoucher(payload: VoucherSavePayload) {
  return request<Voucher>("/accounts/vouchers", { body: JSON.stringify(payload), method: "POST" });
}

export function getAccountsReports() {
  return request<AccountsReportsOverview>("/accounts/reports");
}

export function getAccountsSettings() {
  return request<AccountsSettings>("/accounts/settings");
}

export function saveAccountsSettings(payload: AccountsSettings) {
  return request<AccountsSettings>("/accounts/settings", { body: JSON.stringify(payload), method: "PUT" });
}
