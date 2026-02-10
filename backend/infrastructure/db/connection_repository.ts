import { pool } from './pool';

export interface Connection {
    id: string;
    requester_id: string;
    receiver_id: string;
    status: 'pending' | 'accepted' | 'rejected';
    created_at: Date;
    updated_at: Date;
    requester_first_name?: string;
    requester_last_name?: string;
    requester_headline?: string;
    receiver_first_name?: string;
    receiver_last_name?: string;
    receiver_headline?: string;
}

export async function createRequest(requesterId: string, receiverId: string): Promise<string> {
    const query = `
    INSERT INTO connections (requester_id, receiver_id, status)
    VALUES ($1, $2, 'pending')
    RETURNING id;
  `;
    try {
        const result = await pool.query(query, [requesterId, receiverId]);
        return result.rows[0].id;
    } catch (error: any) {
        if (error.code === '23505') { // unique_violation
            throw new Error('Connection request already exists between these users');
        }
        throw error;
    }
}

export async function updateStatus(connectionId: string, userId: string, status: 'accepted' | 'rejected'): Promise<void> {
    // Ensure the user updating the status is the RECEIVER
    const query = `
    UPDATE connections
    SET status = $1, updated_at = NOW()
    WHERE id = $2 AND receiver_id = $3
  `;
    const result = await pool.query(query, [status, connectionId, userId]);
    if (result.rowCount === 0) {
        throw new Error('Connection not found or you are not authorized to update it');
    }
}

export async function listIncoming(userId: string): Promise<Connection[]> {
    const query = `
    SELECT c.*,
           u.first_name as requester_first_name,
           u.last_name as requester_last_name,
           u.headline as requester_headline
    FROM connections c
    JOIN users u ON c.requester_id = u.id
    WHERE c.receiver_id = $1 AND c.status = 'pending'
    ORDER BY c.created_at DESC
  `;
    const result = await pool.query(query, [userId]);
    return result.rows as Connection[];
}

export async function listOutgoing(userId: string): Promise<Connection[]> {
    const query = `
    SELECT c.*,
           u.first_name as receiver_first_name,
           u.last_name as receiver_last_name,
           u.headline as receiver_headline
    FROM connections c
    JOIN users u ON c.receiver_id = u.id
    WHERE c.requester_id = $1
    ORDER BY c.created_at DESC
  `;
    const result = await pool.query(query, [userId]);
    return result.rows as Connection[];
}

export async function getConnection(id: string): Promise<Connection | null> {
    const query = 'SELECT * FROM connections WHERE id = $1';
    const result = await pool.query(query, [id]);
    return result.rows[0] as Connection || null;
}

export async function listConnections(userId: string): Promise<Connection[]> {
    const query = `
    SELECT c.*,
           u.first_name as requester_first_name,
           u.last_name as requester_last_name,
           u.headline as requester_headline,
           u2.first_name as receiver_first_name,
           u2.last_name as receiver_last_name,
           u2.headline as receiver_headline
    FROM connections c
    JOIN users u ON c.requester_id = u.id
    JOIN users u2 ON c.receiver_id = u2.id
    WHERE (c.requester_id = $1 OR c.receiver_id = $1)
      AND c.status = 'accepted'
    ORDER BY c.updated_at DESC
  `;
    const result = await pool.query(query, [userId]);
    return result.rows.map((row: any) => {
        return {
            id: row.id,
            requester_id: row.requester_id,
            receiver_id: row.receiver_id,
            status: row.status,
            created_at: row.created_at,
            updated_at: row.updated_at,
            ...row
        };
    }) as Connection[];
}
