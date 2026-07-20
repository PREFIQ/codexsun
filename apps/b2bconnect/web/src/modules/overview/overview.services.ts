import type { B2bConnectAppInfo } from "./overview.types";
import { getB2bConnectApiUrl } from "../../config/api";

export { getB2bConnectApiUrl } from "../../config/api";

export async function fetchB2bConnectAppInfo(signal: AbortSignal) {
  const response = await fetch(`${getB2bConnectApiUrl()}/b2bconnect/app-info`, {
    cache: "no-store",
    signal
  });
  if (!response.ok) throw new Error("B2B Connect API is unavailable.");
  const payload = (await response.json()) as { data?: B2bConnectAppInfo } | B2bConnectAppInfo;
  return "data" in payload && payload.data ? payload.data : (payload as B2bConnectAppInfo);
}
