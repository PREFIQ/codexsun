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

export async function registerFileRoutes(app: FastifyInstance) {
  app.get("/files", async (request) => {
    const session = await requireSession(app, request);
    const query = request.query as { ownerModule?: string; ownerRecordId?: string };
    const files = await app.fileService.listFiles(
      session.tenantId || "platform", query.ownerModule, query.ownerRecordId
    );
    return ok(files, responseMeta(request));
  });

  app.post("/files/metadata", async (request) => {
    const session = await requireSession(app, request);
    const body = request.body as {
      ownerModule: string; ownerRecordId: string; fileName: string;
      mimeType: string; size: number; storageKey: string;
    };
    const meta = await app.fileService.createMetadata({
      tenantId: session.tenantId || "platform",
      ownerModule: body.ownerModule, ownerRecordId: body.ownerRecordId,
      fileName: body.fileName, mimeType: body.mimeType, size: body.size,
      storageKey: body.storageKey, createdBy: session.email
    });
    return ok(meta, responseMeta(request));
  });

  app.get("/files/:fileId", async (request) => {
    await requireSession(app, request);
    const { fileId } = request.params as { fileId: string };
    const file = await app.fileService.getFile(fileId);
    return ok(file, responseMeta(request));
  });

  app.delete("/files/:fileId", async (request) => {
    await requireSession(app, request);
    const { fileId } = request.params as { fileId: string };
    await app.fileService.deleteFile(fileId);
    return ok({ deleted: true }, responseMeta(request));
  });
}
