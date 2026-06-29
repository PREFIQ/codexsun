import { AppError } from "@codexsun/framework/errors";
import type { ActivityRecord, CommentRecord, ActivityType } from "./contracts.js";
import type { ActivityRepository } from "./repository.js";

export class ActivityService {
  constructor(private readonly repository: ActivityRepository) {}

  async getActivity(tenantId: string, moduleKey?: string, recordType?: string, recordId?: string): Promise<ActivityRecord[]> {
    if (!tenantId) throw AppError.validation("tenantId is required");
    return this.repository.list(tenantId, moduleKey, recordType, recordId);
  }

  async recordActivity(input: {
    tenantId: string; moduleKey: string; recordType: string; recordId: string;
    actorEmail: string; activityType: ActivityType; message: string;
    payload?: Record<string, unknown>; correlationId?: string;
  }): Promise<void> {
    const activity: ActivityRecord = {
      activityId: crypto.randomUUID(),
      tenantId: input.tenantId, moduleKey: input.moduleKey,
      recordType: input.recordType, recordId: input.recordId,
      actorEmail: input.actorEmail, activityType: input.activityType,
      message: input.message, payload: input.payload,
      correlationId: input.correlationId, createdAt: new Date().toISOString()
    };
    await this.repository.create(activity);
  }

  async getComments(tenantId: string, moduleKey: string, recordType: string, recordId: string): Promise<CommentRecord[]> {
    return this.repository.listComments(tenantId, moduleKey, recordType, recordId);
  }

  async addComment(input: {
    tenantId: string; moduleKey: string; recordType: string; recordId: string;
    authorEmail: string; body: string;
  }): Promise<CommentRecord> {
    if (!input.body?.trim()) throw AppError.validation("Comment body is required");
    const comment: CommentRecord = {
      commentId: crypto.randomUUID(), tenantId: input.tenantId,
      moduleKey: input.moduleKey, recordType: input.recordType,
      recordId: input.recordId, authorEmail: input.authorEmail,
      body: input.body.trim(), createdAt: new Date().toISOString()
    };
    await this.repository.addComment(comment);
    return comment;
  }
}
