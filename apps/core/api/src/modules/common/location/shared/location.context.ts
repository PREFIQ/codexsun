import type { FastifyRequest } from "fastify";

export const GLOBAL_LOCATION_TENANT_ID = "global";

export function resolveLocationTenantId(request: FastifyRequest) {
  const query = request.query as { tenantId?: string } | undefined;
  const raw =
    request.headers["x-tenant-id"] ??
    request.headers["x-codexsun-tenant-id"] ??
    query?.tenantId ??
    GLOBAL_LOCATION_TENANT_ID;
  return normalizeLocationTenantId(Array.isArray(raw) ? (raw[0] ?? GLOBAL_LOCATION_TENANT_ID) : String(raw));
}

export function normalizeLocationTenantId(value: string) {
  const normalized = value.trim().toLowerCase().replace(/[^a-z0-9_-]/g, "");
  return normalized || GLOBAL_LOCATION_TENANT_ID;
}
