import { getTenantDbName, getToken } from "../../../shared/api/tenant-context";
import { requiredClientEnv } from "../../../shared/env/client-env";
import type { ContactRecord, ContactSavePayload } from "./contact.types";
const base = requiredClientEnv("VITE_CORE_API_URL"),
  path = "/core/master/contacts";
type Envelope<T> = { data: T; success: true } | { error: { message: string }; success: false };
async function request<T>(url: string, options: RequestInit = {}) {
  const token = getToken("tenant"),
    database = getTenantDbName();
  const response = await fetch(`${base}${url}`, {
    ...options,
    headers: {
      Accept: "application/json",
      ...(options.body ? { "Content-Type": "application/json" } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(database ? { "x-tenant-db": database } : {}),
      ...options.headers
    }
  });
  const body = (await response.json()) as Envelope<T>;
  if (!response.ok || !body.success)
    throw new Error(body.success ? "Core API request failed." : body.error.message);
  return body.data;
}
export const listContacts = (search = "") =>
  request<ContactRecord[]>(`${path}?search=${encodeURIComponent(search)}`);
export const createContact = (payload: ContactSavePayload) =>
  request<ContactRecord>(path, { body: JSON.stringify(payload), method: "POST" });
export const updateContact = (id: number, payload: ContactSavePayload) =>
  request<ContactRecord>(`${path}/${id}`, { body: JSON.stringify(payload), method: "PUT" });
export const setContactActive = (id: number, active: boolean) =>
  request<ContactRecord>(`${path}/${id}/${active ? "activate" : "deactivate"}`, { method: "POST" });
export const forceDeleteContact = (id: number) =>
  request<ContactRecord>(`${path}/${id}/force`, { method: "DELETE" });
