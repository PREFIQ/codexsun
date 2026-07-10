const TENANT_TOKEN_KEY = "codexsun_session_tenant";
const TENANT_ID_KEY = "codexsun_tenant_id";

export function getToken(_desk?: "tenant"): string | null {
  try {
    return localStorage.getItem(TENANT_TOKEN_KEY);
  } catch {
    return null;
  }
}

export function getTenantId(): string | null {
  try {
    return localStorage.getItem(TENANT_ID_KEY);
  } catch {
    return null;
  }
}
