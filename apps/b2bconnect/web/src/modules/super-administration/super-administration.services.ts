import { getB2bConnectApiUrl } from "../../config/api";
import { getB2bConnectAuthHeaders } from "../authentication";
import type { B2bConnectSuperAdministrationDashboard } from "./super-administration.types";

export async function fetchB2bConnectSuperAdministrationDashboard(signal: AbortSignal) {
  const response = await fetch(`${getB2bConnectApiUrl()}/b2bconnect/sa/dashboard`, {
    cache: "no-store",
    headers: getB2bConnectAuthHeaders("super_admin") ?? {},
    signal
  });
  if (!response.ok) throw new Error("The super administration dashboard is unavailable.");
  const payload = (await response.json()) as { data: B2bConnectSuperAdministrationDashboard };
  return payload.data;
}
