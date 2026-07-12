const TENANT_TOKEN_KEY = "codexsun_session_tenant";
const TENANT_DB_NAME_KEY = "codexsun_tenant_db_name";

export function getToken(_desk?: "tenant"): string | null {
  try {
    return localStorage.getItem(TENANT_TOKEN_KEY);
  } catch {
    return null;
  }
}

export function getTenantDbName(): string | null {
  try {
    return (
      localStorage.getItem(TENANT_DB_NAME_KEY) ??
      import.meta.env.VITE_DEFAULT_TENANT_DB_NAME?.trim() ??
      null
    );
  } catch {
    return import.meta.env.VITE_DEFAULT_TENANT_DB_NAME?.trim() ?? null;
  }
}
