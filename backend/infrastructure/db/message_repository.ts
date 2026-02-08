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

export async function sendMessage(senderId: string, receiverId: string, text: string, attachmentUrl?: string): Promise<Message> {
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

export async function markMessagesAsRead(receiverId: string, senderId: string): Promise<void> {
    await pool.query(
        'UPDATE messages SET read_at = NOW() WHERE receiver_id = $1 AND sender_id = $2 AND read_at IS NULL',
        [receiverId, senderId]
    );
}
