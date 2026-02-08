import { pool } from './pool';

export interface Profile {
    user_id: string;
    about: string | null;
    created_at?: Date;
    updated_at?: Date;
}

export async function getProfile(userId: string): Promise<Profile | null> {
    const query = 'SELECT * FROM user_profiles WHERE user_id = $1';
    const result = await pool.query(query, [userId]);

    if (result.rows.length === 0) {
        return null;
    }

    return result.rows[0] as Profile;
}

export async function upsertProfile(userId: string, about: string): Promise<void> {
    const query = `
    INSERT INTO user_profiles (user_id, about, updated_at)
    VALUES ($1, $2, NOW())
    ON CONFLICT (user_id) DO UPDATE SET
      about = EXCLUDED.about,
      updated_at = NOW();
  `;
    await pool.query(query, [userId, about]);
}
