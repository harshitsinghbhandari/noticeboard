import { pool } from './pool';

export interface Club {
    id: string;
    name: string;
    description: string;
    website_url: string;
    admin_id?: string;
    created_at: string;
    updated_at: string;
}

export async function createClub(name: string, description: string, adminId: string, websiteUrl?: string): Promise<Club> {
    const res = await pool.query(
        'INSERT INTO clubs (name, description, admin_id, website_url) VALUES ($1, $2, $3, $4) RETURNING *',
        [name, description, adminId, websiteUrl]
    );
    return res.rows[0];
}

export async function listClubs(): Promise<Club[]> {
    const res = await pool.query('SELECT * FROM clubs ORDER BY name ASC');
    return res.rows;
}

export async function getClub(id: string): Promise<Club | null> {
    const res = await pool.query('SELECT * FROM clubs WHERE id = $1', [id]);
    return res.rows[0] || null;
}

export async function updateClub(id: string, name: string, description: string, websiteUrl?: string): Promise<Club | null> {
    const res = await pool.query(
        'UPDATE clubs SET name = $1, description = $2, website_url = $3, updated_at = NOW() WHERE id = $4 RETURNING *',
        [name, description, websiteUrl, id]
    );
    return res.rows[0] || null;
}

export async function deleteClub(id: string): Promise<void> {
    await pool.query('DELETE FROM clubs WHERE id = $1', [id]);
}

export async function followClub(clubId: string, userId: string): Promise<void> {
    await pool.query(
        'INSERT INTO club_followers (club_id, user_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
        [clubId, userId]
    );
}

export async function unfollowClub(clubId: string, userId: string): Promise<void> {
    await pool.query(
        'DELETE FROM club_followers WHERE club_id = $1 AND user_id = $2',
        [clubId, userId]
    );
}

export async function listFollowedClubs(userId: string): Promise<Club[]> {
    const res = await pool.query(
        'SELECT c.* FROM clubs c JOIN club_followers f ON c.id = f.club_id WHERE f.user_id = $1',
        [userId]
    );
    return res.rows;
}

export async function isFollowingClub(clubId: string, userId: string): Promise<boolean> {
    const res = await pool.query(
        'SELECT 1 FROM club_followers WHERE club_id = $1 AND user_id = $2',
        [clubId, userId]
    );
    return (res.rowCount ?? 0) > 0;
}
