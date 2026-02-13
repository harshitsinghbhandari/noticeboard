import { getUser, searchUsers } from '../../infrastructure/db/user_repository';
import { getProfile, upsertProfile } from '../../infrastructure/db/profile_repository';
import { listUserPosts } from '../../infrastructure/db/post_repository';
import { isBlocked, blockUser, unblockUser } from '../../infrastructure/db/blocking_repository';
import { createReport } from '../../infrastructure/db/reporting_repository';
import { pool } from '../../infrastructure/db/pool';
import { io } from '../server';

export class UserService {
    static async search(query: string) {
        if (!query || query.length < 2) return [];
        return await searchUsers(query);
    }

    static async getUser(userId: string) {
        const user = await getUser(userId);
        if (!user) throw new Error('User not found');
        return user;
    }

    static async getProfile(userId: string) {
        const profile = await getProfile(userId);
        return profile || { about: null };
    }

    static async updateProfile(userId: string, about: string) {
        if (typeof about !== 'string') throw new Error('About must be a string');
        await upsertProfile(userId, about);
        return await getProfile(userId);
    }

    static async listUserPosts(requesterId: string, targetUserId: string) {
        // NOTE: In a full implementation, we would filter by visibility (public vs connections_only)
        // based on the connection status between requesterId and targetUserId.
        // For now, we restore the ability to call the repository which lists the user's posts.
        return await listUserPosts(targetUserId);
    }

    static async getUserWithContext(requesterId: string, targetUserId: string) {
        const user = await getUser(targetUserId);
        if (!user) throw new Error('User not found');

        const blocked = await isBlocked(requesterId, targetUserId);

        const connQuery = `
            SELECT status, requester_id
            FROM connections
            WHERE (requester_id = $1 AND receiver_id = $2)
               OR (requester_id = $2 AND receiver_id = $1)
        `;
        const connRes = await pool.query(connQuery, [requesterId, targetUserId]);
        let connection_status = null;
        let is_connection_sender = false;

        if (connRes.rows.length > 0) {
            connection_status = connRes.rows[0].status;
            is_connection_sender = connRes.rows[0].requester_id === requesterId;
        }

        return {
            ...user,
            connection_status,
            is_connection_sender,
            is_blocked: blocked
        };
    }

    static async blockUser(userId: string, targetUserId: string) {
        if (targetUserId === userId) throw new Error('Cannot block self');

        await blockUser(userId, targetUserId);

        io.to(`user:${targetUserId}`).emit("user:blocked", {
            by: userId
        });
    }

    static async unblockUser(userId: string, targetUserId: string) {
        await unblockUser(userId, targetUserId);
    }

    static async reportUser(userId: string, targetUserId: string, reason: string) {
        if (!reason || typeof reason !== 'string') throw new Error('Reason is required');
        await createReport(userId, targetUserId, reason);
    }
}
