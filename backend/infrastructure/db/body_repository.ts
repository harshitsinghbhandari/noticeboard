import { pool } from './pool';

export interface Body {
    id: string;
    name: string;
    description: string;
    website_url: string;
    created_at: string;
    updated_at: string;
    is_following?: boolean;
}

export interface BodyMembership {
    body_id: string;
    user_id: string;
    role: 'BODY_ADMIN' | 'BODY_MANAGER' | 'BODY_MEMBER';
}

export interface BodyMemberWithUser extends BodyMembership {
    first_name: string;
    last_name: string;
    email: string;
}

export enum BodyAction {
    CREATE_POST = 'CREATE_POST',
    CREATE_EVENT = 'CREATE_EVENT',
    MANAGE_MEMBERS = 'MANAGE_MEMBERS',
    DELETE_BODY = 'DELETE_BODY',
    EDIT_BODY = 'EDIT_BODY',
}

export async function createBodyWithAdmin(name: string, description: string, websiteUrl: string, adminUserId: string): Promise<Body> {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        // Create Body
        const bodyRes = await client.query(
            'INSERT INTO bodies (name, description, website_url) VALUES ($1, $2, $3) RETURNING *',
            [name, description, websiteUrl]
        );
        const newBody = bodyRes.rows[0];

        // Add Initial Admin
        await client.query(
            "INSERT INTO body_memberships (body_id, user_id, role) VALUES ($1, $2, 'BODY_ADMIN')",
            [newBody.id, adminUserId]
        );

        await client.query('COMMIT');
        return newBody;
    } catch (e) {
        await client.query('ROLLBACK');
        throw e;
    } finally {
        client.release();
    }
}

export async function listBodies(): Promise<Body[]> {
    const res = await pool.query('SELECT * FROM bodies ORDER BY name ASC');
    return res.rows;
}

export async function getBody(id: string): Promise<Body | null> {
    const res = await pool.query('SELECT * FROM bodies WHERE id = $1', [id]);
    return res.rows[0] || null;
}

export async function updateBody(id: string, name: string, description: string, websiteUrl?: string): Promise<Body | null> {
    const res = await pool.query(
        'UPDATE bodies SET name = $1, description = $2, website_url = $3, updated_at = NOW() WHERE id = $4 RETURNING *',
        [name, description, websiteUrl, id]
    );
    return res.rows[0] || null;
}

export async function deleteBody(id: string): Promise<void> {
    await pool.query('DELETE FROM bodies WHERE id = $1', [id]);
}

export async function followBody(bodyId: string, userId: string): Promise<void> {
    await pool.query(
        'INSERT INTO body_followers (body_id, user_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
        [bodyId, userId]
    );
}

export async function unfollowBody(bodyId: string, userId: string): Promise<void> {
    await pool.query(
        'DELETE FROM body_followers WHERE body_id = $1 AND user_id = $2',
        [bodyId, userId]
    );
}

export async function listFollowedBodies(userId: string): Promise<Body[]> {
    const res = await pool.query(
        'SELECT b.* FROM bodies b JOIN body_followers f ON b.id = f.body_id WHERE f.user_id = $1',
        [userId]
    );
    return res.rows;
}

export async function isFollowingBody(bodyId: string, userId: string): Promise<boolean> {
    const res = await pool.query(
        'SELECT 1 FROM body_followers WHERE body_id = $1 AND user_id = $2',
        [bodyId, userId]
    );
    return (res.rowCount ?? 0) > 0;
}

export async function getMemberRole(bodyId: string, userId: string): Promise<string | null> {
    const res = await pool.query(
        'SELECT role FROM body_memberships WHERE body_id = $1 AND user_id = $2',
        [bodyId, userId]
    );
    return res.rows[0]?.role || null;
}

export async function addMember(bodyId: string, userId: string, role: string): Promise<void> {
    await pool.query(
        'INSERT INTO body_memberships (body_id, user_id, role) VALUES ($1, $2, $3) ON CONFLICT (body_id, user_id) DO UPDATE SET role = EXCLUDED.role',
        [bodyId, userId, role]
    );
}

export async function removeMember(bodyId: string, userId: string): Promise<void> {
    await pool.query(
        'DELETE FROM body_memberships WHERE body_id = $1 AND user_id = $2',
        [bodyId, userId]
    );
}

export async function listMembers(bodyId: string): Promise<BodyMemberWithUser[]> {
    const res = await pool.query(
        `SELECT m.*, u.first_name, u.last_name, u.email
         FROM body_memberships m
         JOIN users u ON m.user_id = u.id
         WHERE m.body_id = $1`,
        [bodyId]
    );
    return res.rows as BodyMemberWithUser[];
}

export async function countAdmins(bodyId: string): Promise<number> {
    const res = await pool.query(
        "SELECT COUNT(*) FROM body_memberships WHERE body_id = $1 AND role = 'BODY_ADMIN'",
        [bodyId]
    );
    return parseInt(res.rows[0].count);
}

import { getUser } from './user_repository'; // Import getUser

export async function checkBodyPermission(userId: string, bodyId: string, action: BodyAction): Promise<boolean> {
    // Global override for SYSTEM_ADMIN
    const user = await getUser(userId);
    if (user && user.is_system_admin) {
        return true;
    }

    const role = await getMemberRole(bodyId, userId);
    if (!role) return false;

    switch (action) {
        case BodyAction.CREATE_POST:
            return true; // Any membership
        case BodyAction.CREATE_EVENT:
        case BodyAction.EDIT_BODY:
            return role === 'BODY_ADMIN' || role === 'BODY_MANAGER';
        case BodyAction.MANAGE_MEMBERS:
        case BodyAction.DELETE_BODY:
            return role === 'BODY_ADMIN';
        default:
            return false;
    }
}
