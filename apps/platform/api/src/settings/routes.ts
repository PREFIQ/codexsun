import { ok } from "@codexsun/framework/http";
import type { FastifyInstance } from "fastify";
import { requireSuperAdmin } from "../auth/guards.js";

function responseMeta(request: { correlationId?: string; id: string; tenantId?: string }) {
  return {
    requestId: request.id,
    ...(request.correlationId ? { correlationId: request.correlationId } : {}),
    ...(request.tenantId ? { tenantId: request.tenantId } : {})
  };
}

export async function registerSettingsRoutes(app: FastifyInstance) {
  app.get("/settings/platform", async (request) => {
    await requireSuperAdmin(app, request);
    const settings = await app.settingsService.getPlatformSettingsSummary();
    return ok(settings, responseMeta(request));
  });

  app.get("/settings/platform/:namespace", async (request) => {
    await requireSuperAdmin(app, request);
    const { namespace } = request.params as { namespace: string };
    const settings = await app.settingsService.getSettings("platform", namespace);
    return ok(settings, responseMeta(request));
  });

  app.put("/settings/platform/:namespace/:key", async (request) => {
    await requireSuperAdmin(app, request);
    const { namespace, key } = request.params as { namespace: string; key: string };
    const body = request.body as { value: unknown; isSecret?: boolean };
    await app.settingsService.updateSetting({
      key, scope: "platform", namespace, value: body.value,
      ...(body.isSecret !== undefined ? { isSecret: body.isSecret } : {}),
      updatedBy: "system"
    });
    await app.auditService.recordEvent({
      actorType: "system", actorEmail: "system",
      eventName: "setting.updated",
      payload: { namespace, key },
      ...(request.correlationId ? { correlationId: request.correlationId } : {})
    });
    return ok({ key, namespace, updated: true }, responseMeta(request));
  });

  app.get("/settings/feature-flags", async (request) => {
    await requireSuperAdmin(app, request);
    const { tenantId } = request.query as { tenantId?: string };
    const flags = await app.settingsService.getFeatureFlags(tenantId);
    return ok(flags, responseMeta(request));
  });

  app.put("/settings/feature-flags/:featureKey", async (request) => {
    await requireSuperAdmin(app, request);
    const { featureKey } = request.params as { featureKey: string };
    const body = request.body as { enabled: boolean; tenantId?: string; reason?: string };
    await app.settingsService.setFeatureFlag({
      featureKey, label: "", description: "", enabled: body.enabled,
      ...(body.tenantId ? { tenantId: body.tenantId } : {}),
      ...(body.reason ? { reason: body.reason } : {}),
      updatedBy: "system", updatedAt: new Date().toISOString()
    });
    await app.auditService.recordEvent({
      actorType: "system", actorEmail: "system",
      eventName: body.enabled ? "feature.flag.enabled" : "feature.flag.disabled",
      payload: { featureKey, ...(body.reason ? { reason: body.reason } : {}) },
      ...(request.correlationId ? { correlationId: request.correlationId } : {})
    });
    return ok({ featureKey, enabled: body.enabled }, responseMeta(request));
  });
}
