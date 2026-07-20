import { getB2bConnectApiUrl } from "../../config/api";
import { getB2bConnectAuthHeaders } from "../authentication";
import type { B2bConnectAdministrationDashboard } from "./administration.types";

export async function fetchB2bConnectAdministrationDashboard(signal: AbortSignal) {
  const response = await fetch(`${getB2bConnectApiUrl()}/b2bconnect/admin/dashboard`, {
    cache: "no-store",
    headers: getB2bConnectAuthHeaders("admin") ?? {},
    signal
  });
  if (!response.ok) throw new Error("The administration dashboard is unavailable.");
  const payload = (await response.json()) as { data: B2bConnectAdministrationDashboard };
  return payload.data;
}
