import { getB2bConnectApiUrl } from "../../config/api";
import { getB2bConnectAuthHeaders } from "../authentication";
import type {
  BusinessProfile,
  BusinessProfileValues,
  PublicBusinessProfile
} from "./business-profile.types";

function payload(values: BusinessProfileValues) {
  return {
    association: values.association,
    businessName: values.businessName,
    capacityNote: values.capacityNote,
    capabilities: values.capabilitiesText
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean),
    description: values.description,
    industrySegment: values.industrySegment,
    productsServices: values.productsServices,
    whatsappEnabled: values.whatsappEnabled,
    whatsappNumber: values.whatsappNumber
  };
}
async function errorMessage(response: Response) {
  const body = (await response.json().catch(() => null)) as { error?: { message?: string } } | null;
  return body?.error?.message ?? "The business profile request failed.";
}

export async function fetchOwnBusinessProfile(signal: AbortSignal) {
  const response = await fetch(`${getB2bConnectApiUrl()}/b2bconnect/app/profile`, {
    cache: "no-store",
    headers: getB2bConnectAuthHeaders("client") ?? {},
    signal
  });
  if (!response.ok) throw new Error(await errorMessage(response));
  return ((await response.json()) as { data: BusinessProfile | null }).data;
}
export async function saveOwnBusinessProfile(values: BusinessProfileValues) {
  const response = await fetch(`${getB2bConnectApiUrl()}/b2bconnect/app/profile`, {
    body: JSON.stringify(payload(values)),
    headers: {
      ...(getB2bConnectAuthHeaders("client") ?? {}),
      "content-type": "application/json"
    },
    method: "PUT"
  });
  if (!response.ok) throw new Error(await errorMessage(response));
  return ((await response.json()) as { data: BusinessProfile }).data;
}
export async function fetchAdministrationBusinessProfiles(signal: AbortSignal) {
  const response = await fetch(`${getB2bConnectApiUrl()}/b2bconnect/admin/profiles`, {
    cache: "no-store",
    headers: getB2bConnectAuthHeaders("admin") ?? {},
    signal
  });
  if (!response.ok) throw new Error(await errorMessage(response));
  return ((await response.json()) as { data: BusinessProfile[] }).data;
}
export async function reviewBusinessProfile(
  uuid: string,
  decision: "approve" | "reject",
  note: string
) {
  const response = await fetch(
    `${getB2bConnectApiUrl()}/b2bconnect/admin/profiles/${uuid}/review`,
    {
      body: JSON.stringify({ decision, note }),
      headers: {
        ...(getB2bConnectAuthHeaders("admin") ?? {}),
        "content-type": "application/json"
      },
      method: "PATCH"
    }
  );
  if (!response.ok) throw new Error(await errorMessage(response));
  return ((await response.json()) as { data: BusinessProfile }).data;
}
export async function fetchSuperAdministrationBusinessProfiles(signal: AbortSignal) {
  const response = await fetch(`${getB2bConnectApiUrl()}/b2bconnect/sa/profiles`, {
    cache: "no-store",
    headers: getB2bConnectAuthHeaders("super_admin") ?? {},
    signal
  });
  if (!response.ok) throw new Error(await errorMessage(response));
  return ((await response.json()) as { data: BusinessProfile[] }).data;
}
export async function fetchPublicBusinessProfiles(signal: AbortSignal) {
  const response = await fetch(`${getB2bConnectApiUrl()}/b2bconnect/public/profiles`, {
    cache: "no-store",
    signal
  });
  if (!response.ok) throw new Error("Public business profiles are unavailable.");
  return ((await response.json()) as { data: PublicBusinessProfile[] }).data;
}
