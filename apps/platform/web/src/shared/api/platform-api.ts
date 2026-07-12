import { requiredClientEnv } from "../env/client-env";

const apiBaseUrl = requiredClientEnv("VITE_PLATFORM_API_URL");

export type Desk = "sa" | "admin" | "tenant";

const TOKEN_KEYS: Record<Desk, string> = {
  admin: "codexsun_session_admin",
  sa: "codexsun_session_sa",
  tenant: "codexsun_session_tenant"
};

const TENANT_ID_KEY = "codexsun_tenant_id";
const TENANT_DB_NAME_KEY = "codexsun_tenant_db_name";

type ApiEnvelope<T> = { data: T; success: true } | { error: { message: string }; success: false };

export function getToken(desk: Desk): string | null {
  try {
    return localStorage.getItem(TOKEN_KEYS[desk]);
  } catch {
    return null;
  }
}

export function setToken(desk: Desk, token: string): void {
  try {
    localStorage.setItem(TOKEN_KEYS[desk], token);
  } catch {}
}

export function clearToken(desk: Desk): void {
  try {
    localStorage.removeItem(TOKEN_KEYS[desk]);
  } catch {}
}

export function getTenantId(): string | null {
  try {
    return localStorage.getItem(TENANT_ID_KEY);
  } catch {
    return null;
  }
}

export function setTenantId(id: string | undefined): void {
  try {
    if (id) localStorage.setItem(TENANT_ID_KEY, id);
    else localStorage.removeItem(TENANT_ID_KEY);
  } catch {}
}

export function getTenantDbName(): string | null {
  try {
    return localStorage.getItem(TENANT_DB_NAME_KEY);
  } catch {
    return null;
  }
}

export function setTenantDbName(dbName: string | undefined): void {
  try {
    if (dbName) localStorage.setItem(TENANT_DB_NAME_KEY, dbName);
    else localStorage.removeItem(TENANT_DB_NAME_KEY);
  } catch {}
}

function authHeaders(desk?: Desk): Record<string, string> {
  const headers: Record<string, string> = {};
  const token = desk ? getToken(desk) : null;
  if (token) headers.Authorization = `Bearer ${token}`;
  if (desk === "tenant") {
    const tenantId = getTenantId();
    if (tenantId) headers["x-tenant-id"] = tenantId;
  }
  return headers;
}

async function request<T>(path: string, options: RequestInit = {}, desk?: Desk): Promise<T> {
  const response = await fetch(`${apiBaseUrl}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...authHeaders(desk),
      ...options.headers
    }
  });
  const envelope = (await response.json()) as ApiEnvelope<T>;
  if (!response.ok || !envelope.success) {
    throw new Error(envelope.success ? "Request failed" : envelope.error.message);
  }
  return envelope.data;
}

export function apiGet<T>(path: string, desk?: Desk): Promise<T> {
  return request<T>(path, { method: "GET" }, desk);
}

export function apiPost<T>(path: string, data?: unknown, desk?: Desk): Promise<T> {
  return request<T>(path, { body: JSON.stringify(data ?? {}), method: "POST" }, desk);
}

export function apiPut<T>(path: string, data?: unknown, desk?: Desk): Promise<T> {
  return request<T>(path, { body: JSON.stringify(data ?? {}), method: "PUT" }, desk);
}

export function apiDelete<T>(path: string, desk?: Desk): Promise<T> {
  return request<T>(path, { method: "DELETE" }, desk);
}

function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Request failed";
}

export async function login(input: {
  corporateId?: string;
  desk: Desk;
  email: string;
  password: string;
  tenantCode?: string;
}) {
  try {
    const data = await apiPost<{
      accessToken?: string;
      corporateId?: string;
      email: string;
      tenantId?: string;
      tenantDbName?: string;
      tenantCode?: string;
      tenantUuid?: string;
      userType: string;
    }>("/auth/login", input);

    if (data.accessToken) setToken(input.desk, data.accessToken);
    if (input.desk === "tenant" && data.tenantId) setTenantId(data.tenantId);
    if (input.desk === "tenant" && data.tenantDbName) setTenantDbName(data.tenantDbName);

    return { data, success: true };
  } catch (error: unknown) {
    return { error: { message: errorMessage(error) }, success: false };
  }
}

export async function developmentTenantLogin() {
  try {
    const data = await apiPost<{
      accessToken: string;
      email: string;
      tenantCode: string;
      tenantDbName: string;
      tenantId: string;
      tenantUuid: string;
      userType: "tenant";
    }>("/auth/development/tenant-login");

    setToken("tenant", data.accessToken);
    setTenantId(data.tenantId);
    setTenantDbName(data.tenantDbName);
    return { data, success: true } as const;
  } catch (error: unknown) {
    return { error: { message: errorMessage(error) }, success: false } as const;
  }
}

export async function logout(desk: Desk): Promise<void> {
  try {
    if (getToken(desk)) await apiPost("/auth/logout", undefined, desk);
  } catch {}
  clearToken(desk);
  if (desk === "tenant") {
    setTenantId(undefined);
    setTenantDbName(undefined);
  }
}
