import { createRequest, updateStatus, listIncoming, listOutgoing, listConnections, getConnection } from '../../infrastructure/db/connection_repository';
import { createNotification } from '../../infrastructure/db/notification_repository';
import { io } from '../server';

export class ConnectionService {
    static async requestConnection(requesterId: string, receiverId: string) {
        if (!receiverId || typeof receiverId !== 'string') {
            throw new Error('receiver_id is required');
        }

        if (receiverId === requesterId) {
            throw new Error('Cannot request connection with self');
        }

        const id = await createRequest(requesterId, receiverId);

        io.to(`user:${receiverId}`).emit('connection:request', {
            id,
            requester_id: requesterId,
            status: 'pending'
        });

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

        io.to(`user:${connection.requester_id}`).emit('connection:accepted', {
            id: connectionId,
            receiver_id: userId,
            status: 'accepted'
        });

        return { status: 'accepted' };
    }

    static async rejectConnection(userId: string, connectionId: string) {
        // Need to get connection to know who to notify
        const connection = await getConnection(connectionId);

        await updateStatus(connectionId, userId, 'rejected');

        if (connection) {
            io.to(`user:${connection.requester_id}`).emit('connection:rejected', {
                id: connectionId,
                receiver_id: userId,
                status: 'rejected'
            });
        }

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
