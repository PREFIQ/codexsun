import type { ServiceOrder, ServiceOrderInput, ServiceOrderStatus } from "./service-orders.types";
const base = import.meta.env.VITE_KITCHEN_SERVE_API_URL ?? "http://127.0.0.1:7110";
function context() {
  return {
    "Content-Type": "application/json",
    "x-tenant-id": localStorage.getItem("codexsun_tenant_id") ?? "",
    "x-tenant-db": localStorage.getItem("codexsun_tenant_db_name") ?? ""
  };
}
async function request<T>(path: string, init?: RequestInit) {
  const response = await fetch(`${base}${path}`, {
    ...init,
    headers: { ...context(), ...(init?.headers ?? {}) }
  });
  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as {
      error?: { message?: string };
    } | null;
    throw new Error(body?.error?.message ?? `KitchenServe API request failed: ${response.status}`);
  }
  return ((await response.json()) as { data: T }).data;
}
export const listServiceOrders = (status?: ServiceOrderStatus) =>
  request<ServiceOrder[]>(`/kitchen-serve/orders${status ? `?status=${status}` : ""}`);
export const createServiceOrder = (input: ServiceOrderInput) =>
  request<ServiceOrder>("/kitchen-serve/orders", { method: "POST", body: JSON.stringify(input) });
export const transitionServiceOrder = (id: string, status: ServiceOrderStatus) =>
  request<ServiceOrder>(`/kitchen-serve/orders/${id}/transition`, {
    method: "POST",
    body: JSON.stringify({ status })
  });
