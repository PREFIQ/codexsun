import type { Tenant, TenantAuditEvent, TenantSavePayload } from "./tenant.types.js";

const now = () => new Date().toISOString();

export class TenantRepository {
  private readonly audits = new Map<string, TenantAuditEvent[]>();
  private readonly tenants = new Map<string, Tenant>();

  list() {
    return Array.from(this.tenants.values());
  }

  create(input: TenantSavePayload) {
    const tenant: Tenant = {
      ...input,
      id: `tenant-${input.slug || input.tenantCode.toLowerCase()}-${Date.now()}`
    };
    this.tenants.set(tenant.id, tenant);
    this.audit(tenant.id, "tenant.created");
    return tenant;
  }

  update(id: string, input: TenantSavePayload) {
    const existing = this.tenants.get(id);
    if (!existing) return null;
    const tenant = { ...existing, ...input, id };
    this.tenants.set(id, tenant);
    this.audit(id, "tenant.updated");
    return tenant;
  }

  setStatus(id: string, status: Tenant["status"]) {
    const existing = this.tenants.get(id);
    if (!existing) return null;
    const tenant = { ...existing, status };
    this.tenants.set(id, tenant);
    this.audit(id, status === "active" ? "tenant.restored" : "tenant.suspended");
    return tenant;
  }

  activity(id: string) {
    return this.audits.get(id) ?? [];
  }

  private audit(tenantId: string, eventName: string) {
    const events = this.audits.get(tenantId) ?? [];
    events.unshift({
      actor_email: "system@codexsun.app",
      created_at: now(),
      event_name: eventName,
      id: `${tenantId}-${events.length + 1}`
    });
    this.audits.set(tenantId, events);
  }
}
