import { createRequest, updateStatus, listIncoming, listOutgoing, listConnections, getConnection } from '../../infrastructure/db/connection_repository';
import { createNotification } from '../../infrastructure/db/notification_repository';

export class ConnectionService {
    static async requestConnection(requesterId: string, receiverId: string) {
        if (!receiverId || typeof receiverId !== 'string') {
            throw new Error('receiver_id is required');
        }

        if (receiverId === requesterId) {
            throw new Error('Cannot request connection with self');
        }

        const id = await createRequest(requesterId, receiverId);
        return { id, status: 'pending' };
    }

    static async acceptConnection(userId: string, connectionId: string) {
        const connection = await getConnection(connectionId);
        if (!connection) {
            throw new Error('Connection not found');
        }

        await updateStatus(connectionId, userId, 'accepted');

        // Notify requester
        await createNotification(connection.requester_id, 'connection', userId);

        return { status: 'accepted' };
    }

    static async rejectConnection(userId: string, connectionId: string) {
        await updateStatus(connectionId, userId, 'rejected');
        return { status: 'rejected' };
    }

    static async listIncoming(userId: string) {
        return await listIncoming(userId);
    }

    static async listOutgoing(userId: string) {
        return await listOutgoing(userId);
    }

    static async listConnections(userId: string) {
        return await listConnections(userId);
    }
}
