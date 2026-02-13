import { listConversations, getChat, markMessagesAsRead, sendMessage, getUnreadSummary } from '../../infrastructure/db/message_repository';
import { io } from '../server';

export class MessageService {
    static async listConversations(userId: string) {
        return await listConversations(userId);
    }

    static async getUnreadSummary(userId: string) {
        return await getUnreadSummary(userId);
    }

    static async getChat(userId: string, otherUserId: string) {
        const chat = await getChat(userId, otherUserId);
        const readMessageIds = await markMessagesAsRead(userId, otherUserId);

        readMessageIds.forEach(messageId => {
            io.to(`user:${otherUserId}`).emit("message:read", {
                messageId,
                readerId: userId
            });
        });

        if (readMessageIds.length > 0) {
            io.to(`user:${userId}`).emit("unread:decrement", {
                from: otherUserId,
                count: readMessageIds.length
            });
        }

        return chat;
    }

    static async sendMessage(userId: string, messageData: any) {
        const { receiver_id, message_text, attachment_url } = messageData;
        if (!receiver_id || !message_text) {
            throw new Error('receiver_id and message_text are required');
        }

        const message = await sendMessage(userId, receiver_id, message_text, attachment_url);

        io.to(`user:${receiver_id}`).emit("message:new", message);
        io.to(`user:${receiver_id}`).emit("unread:update", {
            from: userId,
            increment: 1
        });

        return message;
    }
}
