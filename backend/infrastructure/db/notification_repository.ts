import { pool } from './pool';

export interface Notification {
  id: string;
  user_id: string;
  type: 'like' | 'comment' | 'connection';
  actor_id: string;
  post_id?: string;
  created_at: Date;
  read_at?: Date;
  actor_first_name: string;
  actor_last_name: string;
}

export async function createNotification(userId: string, type: 'like' | 'comment' | 'connection', actorId: string, postId?: string): Promise<void> {
  if (userId === actorId) return; // Don't notify self

  const query = `
    INSERT INTO notifications (user_id, type, actor_id, post_id)
    VALUES ($1, $2, $3, $4)
  `;
  await pool.query(query, [userId, type, actorId, postId]);
}

export async function listNotifications(userId: string): Promise<Notification[]> {
  const query = `
    SELECT n.*, u.first_name as actor_first_name, u.last_name as actor_last_name
    FROM notifications n
    JOIN users u ON n.actor_id = u.id
    WHERE n.user_id = $1
    ORDER BY n.read_at ASC NULLS FIRST, n.created_at DESC
  `;
  const result = await pool.query(query, [userId]);
  return result.rows as Notification[];
}

export async function markAsRead(notificationId: string, userId: string): Promise<void> {
  const query = `
    UPDATE notifications
    SET read_at = NOW()
    WHERE id = $1 AND user_id = $2
  `;
  await pool.query(query, [notificationId, userId]);
}
