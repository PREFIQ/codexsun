import { getB2bConnectApiUrl } from "../../config/api";
import { b2bConnectIdentity } from "../../config/identity";
import type {
  B2bConnectLoginValues,
  B2bConnectRole,
  B2bConnectSession
} from "./authentication.types";

type ApiSuccess<T> = { data: T; success: true };
type ApiFailure = { error?: { message?: string }; success: false };
type StoredIdentity = { accessToken: string; tenantDbName?: string; tenantId?: string };
type PlatformLoginResult = StoredIdentity & {
  email: string;
  name?: string;
  tenantCode?: string;
  userType: "staff" | "super_admin" | "tenant";
};

const tokenKeys: Record<B2bConnectRole, string> = {
  admin: "b2bconnect.admin.session",
  client: "b2bconnect.client.session",
  super_admin: "b2bconnect.super-admin.session"
};

const platformDesk: Record<B2bConnectRole, "admin" | "sa" | "tenant"> = {
  admin: "admin",
  client: "tenant",
  super_admin: "sa"
};

export async function loginB2bConnect(role: B2bConnectRole, values: B2bConnectLoginValues) {
  clearB2bConnectRoleToken(role);
  const response = await fetch(`${b2bConnectIdentity.platformApiUrl}/auth/login`, {
    body: JSON.stringify({
      ...(role === "client" ? { corporateId: b2bConnectIdentity.deploymentTenantCode } : {}),
      desk: platformDesk[role],
      email: values.email.trim(),
      password: values.password
    }),
    headers: { "content-type": "application/json" },
    method: "POST"
  });
  const payload = (await response.json()) as ApiSuccess<PlatformLoginResult> | ApiFailure;
  if (!response.ok || !payload.success) {
    throw new Error(payload.success ? "Login failed." : payload.error?.message || "Login failed.");
  }
  if (
    role === "client" &&
    (!payload.data.tenantId ||
      !payload.data.tenantDbName ||
      payload.data.tenantCode?.toUpperCase() !== b2bConnectIdentity.deploymentTenantCode)
  ) {
    throw new Error("This account does not belong to this B2B application.");
  }

  localStorage.setItem(
    tokenKeys[role],
    JSON.stringify({
      accessToken: payload.data.accessToken,
      ...(payload.data.tenantDbName ? { tenantDbName: payload.data.tenantDbName } : {}),
      ...(payload.data.tenantId ? { tenantId: payload.data.tenantId } : {})
    } satisfies StoredIdentity)
  );
  const session = await fetchB2bConnectSession(role);
  if (!session) throw new Error("The B2B application rejected this Platform session.");
  return session;
}

export async function fetchB2bConnectSession(role: B2bConnectRole, signal?: AbortSignal) {
  const headers = getB2bConnectAuthHeaders(role);
  if (!headers) return null;
  const response = await fetch(`${getB2bConnectApiUrl()}/b2bconnect/auth/session`, {
    cache: "no-store",
    headers,
    ...(signal ? { signal } : {})
  });
  if (!response.ok) {
    clearB2bConnectRoleToken(role);
    return null;
  }
  const payload = (await response.json()) as ApiSuccess<B2bConnectSession>;
  if (!payload.success || payload.data.role !== role) {
    clearB2bConnectRoleToken(role);
    return null;
  }
  return payload.data;
}

export async function logoutB2bConnect(role: B2bConnectRole) {
  const headers = getB2bConnectAuthHeaders(role);
  if (headers) {
    await fetch(`${b2bConnectIdentity.platformApiUrl}/auth/logout`, {
      headers,
      method: "POST"
    }).catch(() => undefined);
  }
  clearB2bConnectRoleToken(role);
}

export function getB2bConnectAuthHeaders(role: B2bConnectRole) {
  const identity = readIdentity(role);
  if (!identity) return null;
  return {
    authorization: `Bearer ${identity.accessToken}`,
    ...(identity.tenantDbName ? { "x-tenant-db": identity.tenantDbName } : {}),
    ...(identity.tenantId ? { "x-tenant-id": identity.tenantId } : {})
  };
}

export function clearB2bConnectRoleToken(role: B2bConnectRole) {
  localStorage.removeItem(tokenKeys[role]);
}

function readIdentity(role: B2bConnectRole): StoredIdentity | null {
  const value = localStorage.getItem(tokenKeys[role]);
  if (!value) return null;
  try {
    const parsed = JSON.parse(value) as StoredIdentity;
    return parsed.accessToken ? parsed : null;
  } catch {
    return { accessToken: value };
  }
}
