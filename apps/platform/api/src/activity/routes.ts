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

export async function registerActivityRoutes(app: FastifyInstance) {
  app.get("/activity", async (request) => {
    const session = await requireSession(app, request);
    const query = request.query as { moduleKey?: string; recordType?: string; recordId?: string };
    const activities = await app.activityService.getActivity(
      query.recordId ? "tenant" : (session.tenantId || "tenant"),
      query.moduleKey, query.recordType, query.recordId
    );
    return ok(activities, responseMeta(request));
  });

  app.get("/activity/comments", async (request) => {
    const session = await requireSession(app, request);
    const query = request.query as { moduleKey: string; recordType: string; recordId: string };
    const comments = await app.activityService.getComments(
      session.tenantId || "tenant", query.moduleKey, query.recordType, query.recordId
    );
    return ok(comments, responseMeta(request));
  });

  app.post("/activity/comments", async (request) => {
    const session = await requireSession(app, request);
    const body = request.body as { moduleKey: string; recordType: string; recordId: string; body: string };
    const comment = await app.activityService.addComment({
      tenantId: session.tenantId || "tenant",
      moduleKey: body.moduleKey, recordType: body.recordType,
      recordId: body.recordId, authorEmail: session.email, body: body.body
    });
    return ok(comment, responseMeta(request));
  });
}
