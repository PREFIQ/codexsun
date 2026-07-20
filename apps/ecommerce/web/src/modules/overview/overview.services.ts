import type { EcommerceAppInfo } from "./overview.types";

const apiUrl = import.meta.env.VITE_ECOMMERCE_API_URL ?? "http://127.0.0.1:7150";

export function getEcommerceApiUrl() {
  return apiUrl;
}

export async function fetchEcommerceAppInfo(signal: AbortSignal) {
  const response = await fetch(`${apiUrl}/ecommerce/app-info`, { cache: "no-store", signal });
  if (!response.ok) throw new Error("Ecommerce API is unavailable.");
  const payload = (await response.json()) as { data?: EcommerceAppInfo } | EcommerceAppInfo;
  return "data" in payload && payload.data ? payload.data : (payload as EcommerceAppInfo);
}
