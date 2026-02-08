import { pool } from './pool';
import { AuthUser } from '../http/auth_middleware';

export async function upsertUser(user: AuthUser): Promise<void> {
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

    try {
        await pool.query(query, values);
    } catch (error) {
        console.error('Error upserting user:', error);
        throw error;
    }
}
