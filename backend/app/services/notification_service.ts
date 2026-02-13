import { listNotifications, markAsRead, createNotification } from '../../infrastructure/db/notification_repository';

export class NotificationService {
    static async listNotifications(userId: string) {
        return await listNotifications(userId);
    }

    static async markAsRead(userId: string, notificationId: string) {
        await markAsRead(notificationId, userId);
    }

    static async createNotification(userId: string, type: string, actorId: string, targetId?: string) {
        return await createNotification(userId, type as any, actorId, targetId);
    }
}
