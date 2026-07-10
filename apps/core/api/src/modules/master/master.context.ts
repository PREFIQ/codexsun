import type { FastifyRequest } from "fastify";
export function resolveMasterTenantId(request: FastifyRequest) {
  const header = request.headers["x-tenant-id"];
  const value = Array.isArray(header) ? header[0] : header;
  return typeof value === "string" && value.trim() ? value.trim() : "default";
}
