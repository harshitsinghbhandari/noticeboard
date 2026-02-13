import { pool } from './pool';

export interface Message {
    id: string;
    sender_id: string;
    receiver_id: string;
    message_text: string;
    attachment_url: string | null;
    created_at: string;
    read_at: string | null;
    sender_first_name?: string;
    sender_last_name?: string;
}

import { isBlocked } from './blocking_repository';

export async function sendMessage(senderId: string, receiverId: string, text: string, attachmentUrl?: string): Promise<Message> {
    // 1. Check Blocking
    const blocked = await isBlocked(senderId, receiverId);
    if (blocked) {
        throw new Error('Message cannot be sent due to blocking');
    }

    // 2. Check Connection Status (Must be 'accepted')
    const connectionQuery = `
        SELECT status FROM connections
        WHERE (requester_id = $1 AND receiver_id = $2)
           OR (requester_id = $2 AND receiver_id = $1)
    `;
    const connRes = await pool.query(connectionQuery, [senderId, receiverId]);
    const status = connRes.rows[0]?.status;

    if (status !== 'accepted') {
        throw new Error('Messaging requires an accepted connection');
    }

    // 3. Rate Limit: New Conversations (30 per 24h)
    // Check if conservation exists first
    const existingMsgQuery = `
        SELECT 1 FROM messages
        WHERE (sender_id = $1 AND receiver_id = $2)
           OR (sender_id = $2 AND receiver_id = $1)
        LIMIT 1
    `;
    const msgCheck = await pool.query(existingMsgQuery, [senderId, receiverId]);

    if (msgCheck.rowCount === 0) {
        // This is a new conversation. Check limit.
        const limitQuery = `
            SELECT COUNT(DISTINCT CASE WHEN sender_id = $1 THEN receiver_id ELSE sender_id END) as new_conv_count
            FROM messages
            WHERE (sender_id = $1 OR receiver_id = $1)
              AND created_at > NOW() - INTERVAL '24 hours'
              AND (
                  -- We only want to count conversations STARTED by this user in the last 24h.
                  -- Use a subquery or simplified logic: 
                  -- Count how many distinct people I messaged for the first time in 24h.
                  -- Simplified approximation for "initiations": Count distinct receivers where I was sender and it was my first msg to them in 24h?
                  -- Requirement: "Limit number of new conversations started per user per day."
                  -- "Definition: First message sent to a user where no prior message exists between them."
                  -- Implementation constraint: complex query. 
                  -- Let's count how many distinct receivers I sent a message to in the last 24h, 
                  -- excluding those I had messages with BEFORE 24h ago.
                  -- Actually simpler: just check new conversations started TODAY.
                  id IN (
                    SELECT id FROM messages m2 
                    WHERE m2.sender_id = $1 
                    AND NOT EXISTS (
                        SELECT 1 FROM messages m3 
                        WHERE ((m3.sender_id = m2.sender_id AND m3.receiver_id = m2.receiver_id) OR (m3.sender_id = m2.receiver_id AND m3.receiver_id = m2.sender_id))
                        AND m3.created_at < m2.created_at
                    )
                  )
              )
        `;
        // The above query is getting complicated to do in one "COUNT".
        // Alternative: Count how many "First Messages" this user sent in last 24h.

        const countQuery = `
          SELECT COUNT(*) 
          FROM (
             SELECT 1
             FROM messages m
             WHERE m.sender_id = $1
               AND m.created_at > NOW() - INTERVAL '24 hours'
               AND NOT EXISTS (
                   SELECT 1 FROM messages prior
                   WHERE ((prior.sender_id = m.sender_id AND prior.receiver_id = m.receiver_id) 
                       OR (prior.sender_id = m.receiver_id AND prior.receiver_id = m.sender_id))
                   AND prior.created_at < m.created_at
               )
          ) as recent_starts
        `;

        const limitRes = await pool.query(countQuery, [senderId]);
        const startCount = parseInt(limitRes.rows[0].count, 10);

        if (startCount >= 30) {
            throw new Error('Rate limit exceeded: Cannot start more than 30 new conversations per day');
        }
    }

    const res = await pool.query(
        'INSERT INTO messages (sender_id, receiver_id, message_text, attachment_url) VALUES ($1, $2, $3, $4) RETURNING *',
        [senderId, receiverId, text, attachmentUrl || null]
    );
    return res.rows[0];
}

export async function listConversations(userId: string) {
    const res = await pool.query(
        `SELECT DISTINCT ON (other_id)
            CASE WHEN sender_id = $1 THEN receiver_id ELSE sender_id END as other_id,
            u.first_name, u.last_name,
            m.message_text, m.created_at
         FROM messages m
         JOIN users u ON u.id = (CASE WHEN m.sender_id = $1 THEN m.receiver_id ELSE m.sender_id END)
         WHERE sender_id = $1 OR receiver_id = $1
         ORDER BY other_id, m.created_at DESC`,
        [userId]
    );
    return res.rows;
}

export async function getChat(userId1: string, userId2: string): Promise<Message[]> {
    const res = await pool.query(
        `SELECT m.*, u.first_name as sender_first_name, u.last_name as sender_last_name
         FROM messages m
         JOIN users u ON m.sender_id = u.id
         WHERE (sender_id = $1 AND receiver_id = $2) OR (sender_id = $2 AND receiver_id = $1)
         ORDER BY created_at ASC`,
        [userId1, userId2]
    );
    return res.rows;
}

export async function markMessagesAsRead(receiverId: string, senderId: string): Promise<string[]> {
    const res = await pool.query(
        'UPDATE messages SET read_at = NOW() WHERE receiver_id = $1 AND sender_id = $2 AND read_at IS NULL RETURNING id',
        [receiverId, senderId]
    );
    return res.rows.map(row => row.id);
}

export async function getUnreadSummary(userId: string) {
    const res = await pool.query(
        `SELECT
            sender_id,
            COUNT(*)::int as count
         FROM messages
         WHERE receiver_id = $1
           AND read_at IS NULL
         GROUP BY sender_id`,
        [userId]
    );

    const conversations = res.rows.map(row => ({
        userId: row.sender_id,
        unreadCount: parseInt(row.count, 10)
    }));

    const totalUnread = conversations.reduce((sum, item) => sum + item.unreadCount, 0);

    return {
        totalUnread,
        conversations
    };
}
