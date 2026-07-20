import { getB2bConnectApiUrl } from "../../config/api";
import type { NetworkBlueprint } from "./network-blueprint.types";

export async function fetchNetworkBlueprint(signal: AbortSignal) {
  const response = await fetch(`${getB2bConnectApiUrl()}/b2bconnect/public/network-blueprint`, {
    cache: "no-store",
    signal
  });
  if (!response.ok) throw new Error("The Tirupur industry blueprint is unavailable.");
  return ((await response.json()) as { data: NetworkBlueprint }).data;
}
