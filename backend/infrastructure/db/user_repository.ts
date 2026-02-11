import { pool } from './pool';
import { AuthUser } from '../http/auth_middleware';

export class EmailConflictError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'EmailConflictError';
    }
}

export async function upsertUser(user: AuthUser): Promise<void> {
    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        // Lock on email to prevent race conditions
        const emailRes = await client.query(
            'SELECT id FROM users WHERE email = $1 FOR UPDATE',
            [user.email]
        );

        if (emailRes.rows.length > 0) {
            const existingId = emailRes.rows[0].id;
            if (existingId !== user.id) {
                throw new EmailConflictError(`Email ${user.email} is already in use by another user.`);
            }
        }

        const query = `
      INSERT INTO users (id, email, first_name, last_name, updated_at)
      VALUES ($1, $2, $3, $4, NOW())
      ON CONFLICT (id) DO UPDATE SET
        email = EXCLUDED.email,
        first_name = EXCLUDED.first_name,
        last_name = EXCLUDED.last_name,
        updated_at = NOW();
    `;
        const values = [user.id, user.email, user.first_name, user.last_name];

        await client.query(query, values);

        await client.query('COMMIT');
    } catch (error) {
        await client.query('ROLLBACK');
        throw error;
    } finally {
        client.release();
    }
}

export interface UserRow {
    id: string;
    email: string;
    first_name: string;
    last_name: string;
    headline: string | null;
    created_at: Date;
    updated_at: Date;
    is_system_admin: boolean; // Added field
}

export async function getUser(id: string): Promise<UserRow | null> {
    const query = 'SELECT * FROM users WHERE id = $1';
    const result = await pool.query(query, [id]);

    if (result.rows.length === 0) {
        return null;
    }

    return result.rows[0] as UserRow;
}

export async function searchUsers(queryStr: string): Promise<UserRow[]> {
    const query = `
        SELECT * FROM users 
        WHERE email ILIKE $1 OR first_name ILIKE $1 OR last_name ILIKE $1
        LIMIT 10
    `;
    const result = await pool.query(query, [`%${queryStr}%`]);
    return result.rows as UserRow[];
}
