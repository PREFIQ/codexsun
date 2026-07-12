import { getTenantDbName, getToken } from "../../../shared/api/tenant-context";
import { requiredClientEnv } from "../../../shared/env/client-env";
import type { ProductRecord, ProductSavePayload } from "./product.types";
const base = requiredClientEnv("VITE_CORE_API_URL"),
  path = "/core/master/products";
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
export const listProducts = (search = "") =>
  request<ProductRecord[]>(`${path}?search=${encodeURIComponent(search)}`);
export const createProduct = (payload: ProductSavePayload) =>
  request<ProductRecord>(path, { body: JSON.stringify(payload), method: "POST" });
export const updateProduct = (id: number, payload: ProductSavePayload) =>
  request<ProductRecord>(`${path}/${id}`, { body: JSON.stringify(payload), method: "PUT" });
export const setProductActive = (id: number, active: boolean) =>
  request<ProductRecord>(`${path}/${id}/${active ? "activate" : "deactivate"}`, { method: "POST" });
export const forceDeleteProduct = (id: number) =>
  request<ProductRecord>(`${path}/${id}/force`, { method: "DELETE" });
