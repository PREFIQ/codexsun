import { ok } from "@codexsun/framework/http";
import type { FastifyInstance } from "fastify";
import { requireSession } from "../auth/guards.js";

function responseMeta(request: { correlationId?: string; id: string; tenantId?: string }) {
  return {
    requestId: request.id,
    ...(request.correlationId ? { correlationId: request.correlationId } : {}),
    ...(request.tenantId ? { tenantId: request.tenantId } : {})
  };
}

export async function registerNotificationRoutes(app: FastifyInstance) {
  app.get("/notifications", async (request) => {
    const session = await requireSession(app, request);
    const notifications = await app.notificationService.listNotifications(session.email, session.tenantId);
    return ok(notifications, responseMeta(request));
  });

  app.put("/notifications/:id/read", async (request) => {
    await requireSession(app, request);
    const { id } = request.params as { id: string };
    await app.notificationService.markRead(id);
    return ok({ read: true }, responseMeta(request));
  });

  app.put("/notifications/read-all", async (request) => {
    const session = await requireSession(app, request);
    await app.notificationService.markAllRead(session.email);
    return ok({ read: true }, responseMeta(request));
  });

  app.get("/notifications/mail-templates", async (request) => {
    await requireSession(app, request);
    const templates = app.notificationService.getMailTemplates();
    return ok(templates, responseMeta(request));
  });
}
