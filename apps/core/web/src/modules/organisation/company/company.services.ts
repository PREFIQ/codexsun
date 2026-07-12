import { getTenantDbName, getToken } from "../../../shared/api/tenant-context";
import { requiredClientEnv } from "../../../shared/env/client-env";
import type { CompanyIndustry, CompanyRecord, CompanySavePayload } from "./company.types";
const base = requiredClientEnv("VITE_CORE_API_URL"),
  path = "/core/organisation/companies";
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
export const listCompanies = (search = "") =>
  request<CompanyRecord[]>(`${path}?search=${encodeURIComponent(search)}`);
export const createCompany = (payload: CompanySavePayload) =>
  request<CompanyRecord>(path, { body: JSON.stringify(payload), method: "POST" });
export const updateCompany = (id: number, payload: CompanySavePayload) =>
  request<CompanyRecord>(`${path}/${id}`, { body: JSON.stringify(payload), method: "PUT" });
export const listCompanyIndustries = () =>
  request<CompanyIndustry[]>("/core/organisation/industries");
