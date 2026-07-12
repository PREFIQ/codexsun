import type { ServiceOrder, ServiceOrderInput, ServiceOrderStatus } from "./service-orders.types";
const base = import.meta.env.VITE_KITCHEN_SERVE_API_URL ?? "http://127.0.0.1:7110";
const platformBase = import.meta.env.VITE_PLATFORM_API_URL ?? "http://127.0.0.1:7010";
let tenantBootstrap: Promise<void> | null = null;

async function ensureTenantContext() {
  if (localStorage.getItem("codexsun_tenant_id")) return;
  if (!import.meta.env.DEV) {
    throw new Error("No tenant session found. Sign in through the CODEXSUN Platform first.");
  }
  tenantBootstrap ??= fetch(`${platformBase}/auth/development/tenant-login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: "{}"
  })
    .then(async (response) => {
      const envelope = (await response.json().catch(() => null)) as {
        data?: { accessToken: string; tenantDbName: string; tenantId: string };
        error?: { message?: string };
      } | null;
      if (!response.ok || !envelope?.data) {
        throw new Error(
          envelope?.error?.message ?? "Could not start the development tenant session."
        );
      }
      localStorage.setItem("codexsun_session_tenant", envelope.data.accessToken);
      localStorage.setItem("codexsun_tenant_id", envelope.data.tenantId);
      localStorage.setItem("codexsun_tenant_db_name", envelope.data.tenantDbName);
    })
    .catch((error) => {
      tenantBootstrap = null;
      if (error instanceof TypeError) {
        // KitchenServe can run by itself during local UI/API development. The API
        // validates the database name and keeps every query tenant-scoped.
        localStorage.setItem("codexsun_tenant_id", "kitchen-serve-development");
        localStorage.setItem("codexsun_tenant_db_name", "cxsun_master_db");
        return;
      }
      throw error;
    });
  await tenantBootstrap;
}

function context() {
  return {
    "Content-Type": "application/json",
    "x-tenant-id": localStorage.getItem("codexsun_tenant_id") ?? "",
    "x-tenant-db": localStorage.getItem("codexsun_tenant_db_name") ?? ""
  };
}
async function request<T>(path: string, init?: RequestInit) {
  await ensureTenantContext();
  let response: Response;
  try {
    response = await fetch(`${base}${path}`, {
      ...init,
      headers: { ...context(), ...(init?.headers ?? {}) }
    });
  } catch {
    throw new Error(
      "KitchenServe service is unavailable. Start the KitchenServe stack and try again."
    );
  }
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
export async function createAndSubmitServiceOrder(input: ServiceOrderInput) {
  const order = await createServiceOrder(input);
  return transitionServiceOrder(order.uuid, "submitted");
}
export const transitionServiceOrder = (id: string, status: ServiceOrderStatus) =>
  request<ServiceOrder>(`/kitchen-serve/orders/${id}/transition`, {
    method: "POST",
    body: JSON.stringify({ status })
  });
