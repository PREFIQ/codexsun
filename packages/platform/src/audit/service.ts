import type { AuditEvent } from "./contracts.js";
import type { AuditRepository } from "./repository.js";

export class AuditService {
  constructor(
    private readonly repository: AuditRepository,
    private readonly logger?: { warn(message: string, ...args: unknown[]): void }
  ) {}

  async write(event: AuditEvent): Promise<void> {
    try {
      await this.repository.write(event);
    } catch (error) {
      if (this.logger) {
        this.logger.warn("Audit write failed (non-blocking)", error);
      }
    }
  }

  async authLoginSuccess(input: { actorType: AuditEvent["actorType"]; actorEmail: string; correlationId?: string; tenantId?: string }): Promise<void> {
    await this.write({
      actorType: input.actorType,
      actorEmail: input.actorEmail,
      ...(input.correlationId ? { correlationId: input.correlationId } : {}),
      eventName: "auth.login.success",
      ...(input.tenantId ? { tenantId: input.tenantId } : {}),
      payload: { email: input.actorEmail }
    });
  }

  async authLoginFailed(input: { actorType: AuditEvent["actorType"]; actorEmail: string; correlationId?: string }): Promise<void> {
    await this.write({
      actorType: input.actorType,
      actorEmail: input.actorEmail,
      ...(input.correlationId ? { correlationId: input.correlationId } : {}),
      eventName: "auth.login.failed",
      payload: { email: input.actorEmail }
    });
  }

  async authLogout(input: { actorType: AuditEvent["actorType"]; actorEmail: string; correlationId?: string; tenantId?: string }): Promise<void> {
    await this.write({
      actorType: input.actorType,
      actorEmail: input.actorEmail,
      ...(input.correlationId ? { correlationId: input.correlationId } : {}),
      eventName: "auth.logout",
      ...(input.tenantId ? { tenantId: input.tenantId } : {}),
      payload: { email: input.actorEmail }
    });
  }

  async recordEvent(input: {
    actorType: AuditEvent["actorType"]; actorEmail: string;
    eventName: string; payload?: Record<string, unknown>;
    correlationId?: string; tenantId?: string;
  }): Promise<void> {
    await this.write({
      actorType: input.actorType,
      actorEmail: input.actorEmail,
      eventName: input.eventName,
      ...(input.correlationId ? { correlationId: input.correlationId } : {}),
      ...(input.tenantId ? { tenantId: input.tenantId } : {}),
      ...(input.payload ? { payload: input.payload } : {})
    });
  }

  async tenantCreated(input: { actorEmail: string; correlationId?: string; tenantId: string; tenantCode: string }): Promise<void> {
    await this.write({
      actorType: "super_admin",
      actorEmail: input.actorEmail,
      ...(input.correlationId ? { correlationId: input.correlationId } : {}),
      eventName: "tenant.created",
      tenantId: input.tenantId,
      payload: { tenantCode: input.tenantCode, tenantId: input.tenantId }
    });
  }

  async tenantUpdated(input: { actorEmail: string; correlationId?: string; tenantId: string; changes: Record<string, unknown> }): Promise<void> {
    await this.write({
      actorType: "super_admin",
      actorEmail: input.actorEmail,
      ...(input.correlationId ? { correlationId: input.correlationId } : {}),
      eventName: "tenant.updated",
      tenantId: input.tenantId,
      payload: { changes: input.changes, tenantId: input.tenantId }
    });
  }

  async tenantDeleted(input: { actorEmail: string; correlationId?: string; tenantId: string; tenantCode: string }): Promise<void> {
    await this.write({
      actorType: "super_admin",
      actorEmail: input.actorEmail,
      ...(input.correlationId ? { correlationId: input.correlationId } : {}),
      eventName: "tenant.deleted",
      tenantId: input.tenantId,
      payload: { tenantCode: input.tenantCode, tenantId: input.tenantId }
    });
  }
}
