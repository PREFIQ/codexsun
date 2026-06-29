export type ActivityType = "system" | "comment" | "audit" | "status_change" | "assignment" | "mention";

export type ActivityRecord = {
  activityId: string;
  tenantId: string;
  moduleKey: string;
  recordType: string;
  recordId: string;
  actorEmail: string;
  activityType: ActivityType;
  message: string;
  payload?: Record<string, unknown> | undefined;
  correlationId?: string | undefined;
  createdAt: string;
};

export type CommentRecord = {
  commentId: string;
  tenantId: string;
  moduleKey: string;
  recordType: string;
  recordId: string;
  authorEmail: string;
  body: string;
  createdAt: string;
  updatedAt?: string | undefined;
};
