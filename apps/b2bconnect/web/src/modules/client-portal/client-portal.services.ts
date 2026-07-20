import { getB2bConnectApiUrl } from "../../config/api";
import { getB2bConnectAuthHeaders } from "../authentication";
import type { B2bConnectClientPortalDashboard } from "./client-portal.types";

export async function fetchB2bConnectClientPortalDashboard(signal: AbortSignal) {
  const response = await fetch(`${getB2bConnectApiUrl()}/b2bconnect/app/dashboard`, {
    cache: "no-store",
    headers: getB2bConnectAuthHeaders("client") ?? {},
    signal
  });
  if (!response.ok) throw new Error("The client portal dashboard is unavailable.");
  const payload = (await response.json()) as { data: B2bConnectClientPortalDashboard };
  return payload.data;
}
