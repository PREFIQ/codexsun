const TENANT_TOKEN_KEY = "codexsun_session_tenant";
const TENANT_ID_KEY = "codexsun_tenant_id";
const TENANT_DB_NAME_KEY = "codexsun_tenant_db_name";
const COMPANY_ID_KEY = "codexsun.tenant.company-id";
const FINANCIAL_YEAR_ID_KEY = "codexsun.tenant.financial-year-id";

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

export function getTenantDbName(): string | null {
  try {
    return localStorage.getItem(TENANT_DB_NAME_KEY);
  } catch {
    return null;
  }
}

export function getCompanyId(): number | null {
  try {
    const value = Number(localStorage.getItem(COMPANY_ID_KEY));
    return Number.isInteger(value) && value > 0 ? value : null;
  } catch {
    return null;
  }
}

export function getFinancialYearId(): number | null {
  try {
    const value = Number(localStorage.getItem(FINANCIAL_YEAR_ID_KEY));
    return Number.isInteger(value) && value > 0 ? value : null;
  } catch {
    return null;
  }
}

export function getTenantUserLabel(): string {
  const token = getToken("tenant");
  if (!token) return "user";

  try {
    const encoded = token.split(".")[1];
    if (!encoded) return "user";
    const payload = JSON.parse(atob(encoded.replace(/-/g, "+").replace(/_/g, "/"))) as {
      email?: unknown;
    };
    if (typeof payload.email !== "string" || !payload.email.trim()) return "user";
    return payload.email.split("@")[0]?.trim() || "user";
  } catch {
    return "user";
  }
}
