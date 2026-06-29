import type { ActivityRecord, CommentRecord } from "./contracts.js";

export interface ActivityRepository {
  list(tenantId: string, moduleKey?: string, recordType?: string, recordId?: string): Promise<ActivityRecord[]>;
  create(activity: ActivityRecord): Promise<void>;
  listComments(tenantId: string, moduleKey: string, recordType: string, recordId: string): Promise<CommentRecord[]>;
  addComment(comment: CommentRecord): Promise<void>;
}

export class InMemoryActivityRepository implements ActivityRepository {
  private activities: ActivityRecord[] = [];
  private comments: CommentRecord[] = [];

  async list(tenantId: string, moduleKey?: string, recordType?: string, recordId?: string): Promise<ActivityRecord[]> {
    return this.activities.filter((a) => {
      if (a.tenantId !== tenantId) return false;
      if (moduleKey && a.moduleKey !== moduleKey) return false;
      if (recordType && a.recordType !== recordType) return false;
      if (recordId && a.recordId !== recordId) return false;
      return true;
    }).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  async create(activity: ActivityRecord): Promise<void> {
    this.activities.push(activity);
  }

  async listComments(tenantId: string, moduleKey: string, recordType: string, recordId: string): Promise<CommentRecord[]> {
    return this.comments.filter((c) => c.tenantId === tenantId && c.moduleKey === moduleKey && c.recordType === recordType && c.recordId === recordId)
      .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  }

  async addComment(comment: CommentRecord): Promise<void> {
    this.comments.push(comment);
  }
}
