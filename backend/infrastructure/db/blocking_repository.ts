import { pool } from './pool';

export async function blockUser(blockerId: string, blockedId: string): Promise<void> {
    if (blockerId === blockedId) {
        throw new Error('Cannot block self');
    }

    // Use ON CONFLICT DO NOTHING to match requirements (if already blocked, just succeed)
    // OR we could throw, but requirement just says "Prevent self-blocking". 
    // Standard block behavior is idempotent.
    const query = `
        INSERT INTO blocked_users (blocker_id, blocked_id)
        VALUES ($1, $2)
        ON CONFLICT (blocker_id, blocked_id) DO NOTHING
    `;
    await pool.query(query, [blockerId, blockedId]);
}

export async function unblockUser(blockerId: string, blockedId: string): Promise<void> {
    const query = `
        DELETE FROM blocked_users
        WHERE blocker_id = $1 AND blocked_id = $2
    `;
    await pool.query(query, [blockerId, blockedId]);
}

export async function isBlocked(userId1: string, userId2: string): Promise<boolean> {
    const query = `
        SELECT 1 FROM blocked_users
        WHERE (blocker_id = $1 AND blocked_id = $2)
           OR (blocker_id = $2 AND blocked_id = $1)
    `;
    const result = await pool.query(query, [userId1, userId2]);
    return result.rowCount !== null && result.rowCount > 0;
}
