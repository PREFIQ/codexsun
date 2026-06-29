import type { NotificationRecord } from "./contracts.js";

export interface NotificationRepository {
  list(recipientEmail: string, tenantId?: string): Promise<NotificationRecord[]>;
  create(notification: NotificationRecord): Promise<void>;
  markRead(notificationId: string): Promise<void>;
  markAllRead(recipientEmail: string): Promise<void>;
}

export class InMemoryNotificationRepository implements NotificationRepository {
  private notifications: NotificationRecord[] = [];

  async list(recipientEmail: string, tenantId?: string): Promise<NotificationRecord[]> {
    return this.notifications.filter((n) => {
      if (n.recipientEmail !== recipientEmail) return false;
      if (tenantId && n.tenantId !== tenantId) return false;
      return true;
    }).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  async create(notification: NotificationRecord): Promise<void> {
    this.notifications.push(notification);
  }

  async markRead(notificationId: string): Promise<void> {
    const n = this.notifications.find((x) => x.notificationId === notificationId);
    if (n) n.status = "read";
  }

  async markAllRead(recipientEmail: string): Promise<void> {
    for (const n of this.notifications) {
      if (n.recipientEmail === recipientEmail) n.status = "read";
    }
  }
}
