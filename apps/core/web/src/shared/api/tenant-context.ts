const TENANT_TOKEN_KEY = "codexsun_session_tenant";
const TENANT_ID_KEY = "codexsun_tenant_id";
const COMPANY_ID_KEY = "codexsun_company_id";

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

export function getCompanyId(): string | null {
  try {
    return localStorage.getItem(COMPANY_ID_KEY);
  } catch {
    return null;
  }
}

export function setCompanyId(id: string | undefined): void {
  try {
    if (id) localStorage.setItem(COMPANY_ID_KEY, id);
    else localStorage.removeItem(COMPANY_ID_KEY);
  } catch {}
}
