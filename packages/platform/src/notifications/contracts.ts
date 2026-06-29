export type NotificationChannel = "app" | "email" | "telegram" | "whatsapp";
export type NotificationStatus = "unread" | "read" | "archived";
export type NotificationPriority = "low" | "normal" | "high" | "urgent";

export type NotificationMessage = {
  channel: NotificationChannel;
  message: string;
  recipient: string;
  tenantId?: string | undefined;
  title: string;
};

export type NotificationRecord = {
  notificationId: string;
  recipientEmail: string;
  tenantId?: string | undefined;
  module: string;
  title: string;
  body: string;
  status: NotificationStatus;
  priority: NotificationPriority;
  actionHref?: string | undefined;
  createdAt: string;
};

export type MailTemplate = {
  templateKey: string;
  label: string;
  subject: string;
  body: string;
  module: string;
  version: string;
};

export type MailQueueJob = {
  jobId: string;
  templateKey: string;
  recipient: string;
  subject: string;
  body: string;
  status: "queued" | "sent" | "failed";
  correlationId?: string | undefined;
  tenantId?: string | undefined;
  createdAt: string;
};
