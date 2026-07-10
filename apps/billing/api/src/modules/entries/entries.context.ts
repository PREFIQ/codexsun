import type { FastifyRequest } from "fastify";

export const GLOBAL_ENTRIES_TENANT_ID = "global";

export function resolveEntriesTenantId(request: FastifyRequest) {
  const query = request.query as { tenantId?: string } | undefined;
  const raw =
    request.headers["x-tenant-id"] ??
    request.headers["x-codexsun-tenant-id"] ??
    query?.tenantId ??
    GLOBAL_ENTRIES_TENANT_ID;
  return normalizeEntriesTenantId(Array.isArray(raw) ? (raw[0] ?? GLOBAL_ENTRIES_TENANT_ID) : String(raw));
}

export function normalizeEntriesTenantId(value: string) {
  const normalized = value.trim().toLowerCase().replace(/[^a-z0-9_-]/g, "");
  return normalized || GLOBAL_ENTRIES_TENANT_ID;
}
