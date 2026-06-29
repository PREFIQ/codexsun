import type { NotificationRecord, NotificationPriority, MailQueueJob, MailTemplate } from "./contracts.js";
import type { NotificationRepository } from "./repository.js";

export class NotificationService {
  constructor(private readonly repository: NotificationRepository) {}

  async listNotifications(recipientEmail: string, tenantId?: string): Promise<NotificationRecord[]> {
    return this.repository.list(recipientEmail, tenantId);
  }

  async sendNotification(input: {
    recipientEmail: string; tenantId?: string; module: string;
    title: string; body: string; priority?: NotificationPriority; actionHref?: string;
  }): Promise<NotificationRecord> {
    const notification: NotificationRecord = {
      notificationId: crypto.randomUUID(), recipientEmail: input.recipientEmail,
      tenantId: input.tenantId, module: input.module, title: input.title,
      body: input.body, status: "unread", priority: input.priority || "normal",
      actionHref: input.actionHref, createdAt: new Date().toISOString()
    };
    await this.repository.create(notification);
    return notification;
  }

  async markRead(notificationId: string): Promise<void> {
    await this.repository.markRead(notificationId);
  }

  async markAllRead(recipientEmail: string): Promise<void> {
    await this.repository.markAllRead(recipientEmail);
  }

  getMailTemplates(): MailTemplate[] {
    return [
      { templateKey: "welcome_email", label: "Welcome Email", subject: "Welcome to Codexsun", body: "Hello {{name}}, welcome!", module: "auth", version: "1.0" },
      { templateKey: "password_reset", label: "Password Reset", subject: "Reset Your Password", body: "Click here to reset: {{link}}", module: "auth", version: "1.0" },
      { templateKey: "invoice_ready", label: "Invoice Ready", subject: "Your Invoice is Ready", body: "Invoice {{number}} is ready.", module: "billing", version: "1.0" }
    ];
  }

  queueMail(input: { templateKey: string; recipient: string; subject: string; body: string; correlationId?: string; tenantId?: string }): MailQueueJob {
    return {
      jobId: crypto.randomUUID(), templateKey: input.templateKey,
      recipient: input.recipient, subject: input.subject, body: input.body,
      status: "queued", correlationId: input.correlationId,
      tenantId: input.tenantId, createdAt: new Date().toISOString()
    };
  }
}
