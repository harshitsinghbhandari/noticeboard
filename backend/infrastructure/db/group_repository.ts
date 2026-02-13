import { pool } from './pool';
import { v4 as uuidv4 } from 'uuid';

export interface Group {
    id: string;
    name: string;
    description: string;
    created_by: string;
    type: 'regular' | 'event';
    max_members: number;
    is_active: boolean;
    created_at: Date;
    unread_count?: number;
    last_message?: {
        content: string;
        created_at: Date;
        sender_first_name: string;
        sender_last_name: string;
    } | null;
}

export interface GroupMember {
    group_id: string;
    user_id: string;
    role: 'owner' | 'admin' | 'member';
    status: 'active' | 'left' | 'removed';
    joined_at: Date;
    acted_by: string; // who added them
}

export interface GroupMessage {
    id: string;
    group_id: string;
    sender_id: string;
    content: string;
    created_at: Date;
    sender_first_name?: string;
    sender_last_name?: string;
    is_organizer?: boolean;
}

export interface CreateGroupParams {
    name: string;
    description: string;
    creatorId: string;
    memberIds: string[]; // Initial members to add
}

export async function createGroup(params: CreateGroupParams): Promise<Group> {
    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        const groupId = uuidv4();

        // 1. Create Group
        const insertGroupQuery = `
            INSERT INTO groups (id, name, description, created_by, type, max_members, is_active)
            VALUES ($1, $2, $3, $4, 'regular', 100, true)
            RETURNING *
        `;
        const groupRes = await client.query(insertGroupQuery, [
            groupId,
            params.name,
            params.description,
            params.creatorId
        ]);
        const group = groupRes.rows[0];

        // 2. Add Creator as Owner
        // 3. Add Members
        // We can do this in a loop or bulk insert. Let's do a loop for clarity and individual validations if needed,
        // though bulk is more efficient. For < 100 members, loop is fine or UNNEST.
        // Let's use a loop to handle the different roles/statuses easily.

        // Add Creator
        await client.query(`
            INSERT INTO group_members (group_id, user_id, role, status, acted_by)
            VALUES ($1, $2, 'owner', 'active', $2)
        `, [groupId, params.creatorId]);

        // Add other members
        // Filter out creator if they are in memberIds to avoid duplicate key error
        const uniqueMemberIds = [...new Set(params.memberIds)].filter(id => id !== params.creatorId);

        if (uniqueMemberIds.length + 1 > 100) {
            throw new Error("Group size limit exceeded");
        }

        for (const memberId of uniqueMemberIds) {
            await client.query(`
                INSERT INTO group_members (group_id, user_id, role, status, acted_by)
                VALUES ($1, $2, 'member', 'active', $3)
            `, [groupId, memberId, params.creatorId]);
        }

        await client.query('COMMIT');
        return group;

    } catch (e) {
        await client.query('ROLLBACK');
        throw e;
    } finally {
        client.release();
    }
}

export async function getGroup(groupId: string): Promise<Group | null> {
    const res = await pool.query('SELECT * FROM groups WHERE id = $1', [groupId]);
    return res.rows[0] || null;
}

export async function getGroupMember(groupId: string, userId: string): Promise<GroupMember | null> {
    const res = await pool.query(
        'SELECT * FROM group_members WHERE group_id = $1 AND user_id = $2',
        [groupId, userId]
    );
    return res.rows[0] || null;
}

export async function addGroupMember(groupId: string, targetUserId: string, actorId: string): Promise<void> {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        // Check if group is active
        const groupRes = await client.query('SELECT is_active, max_members FROM groups WHERE id = $1', [groupId]);
        if (groupRes.rows.length === 0) throw new Error("Group not found");
        if (!groupRes.rows[0].is_active) throw new Error("Group is not active");

        const maxMembers = groupRes.rows[0].max_members;

        // Check actor permission
        const actorRes = await client.query(
            "SELECT role, status FROM group_members WHERE group_id = $1 AND user_id = $2",
            [groupId, actorId]
        );
        if (actorRes.rows.length === 0 || actorRes.rows[0].status !== 'active') {
            throw new Error("You are not a member of this group");
        }
        if (!['owner', 'admin'].includes(actorRes.rows[0].role)) {
            throw new Error("Only admins can add members");
        }

        // Lock group members for count
        // We lock rows of this group to prevent concurrent inserts exceeding limit
        // 'SELECT 1 FROM group_members WHERE group_id = $1 FOR UPDATE' might lock too much or too little depending on implementation.
        // Better: explicit check with count inside transaction with serializable isolation OR explicit lock.
        // Simplest compliant way: Lock the group row itself or use a specific lock advice.
        // Let's lock the group row for update to serialize additions to this group.
        await client.query('SELECT id FROM groups WHERE id = $1 FOR UPDATE', [groupId]);

        // Count active members
        const countRes = await client.query(
            "SELECT COUNT(*) as count FROM group_members WHERE group_id = $1 AND status = 'active'",
            [groupId]
        );
        const currentCount = parseInt(countRes.rows[0].count);

        if (currentCount >= maxMembers) {
            throw new Error("Group is full");
        }

        // Upsert member: if they were 'left', status becomes 'active'
        const checkMember = await client.query(
            "SELECT * FROM group_members WHERE group_id = $1 AND user_id = $2",
            [groupId, targetUserId]
        );

        if (checkMember.rows.length > 0) {
            const member = checkMember.rows[0];
            if (member.status === 'active') {
                throw new Error("User is already a member");
            }
            // Re-join
            await client.query(
                "UPDATE group_members SET status = 'active', role = 'member', joined_at = NOW(), acted_by = $3 WHERE group_id = $1 AND user_id = $2",
                [groupId, targetUserId, actorId]
            );
        } else {
            // New join
            await client.query(`
                INSERT INTO group_members (group_id, user_id, role, status, acted_by)
                VALUES ($1, $2, 'member', 'active', $3)
            `, [groupId, targetUserId, actorId]);
        }

        await client.query('COMMIT');
    } catch (e) {
        await client.query('ROLLBACK');
        throw e;
    } finally {
        client.release();
    }
}

export async function leaveGroup(groupId: string, userId: string): Promise<void> {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        // Check current membership
        const memberRes = await client.query(
            "SELECT role, status FROM group_members WHERE group_id = $1 AND user_id = $2 FOR UPDATE",
            [groupId, userId]
        );

        if (memberRes.rows.length === 0 || memberRes.rows[0].status !== 'active') {
            throw new Error("Not an active member");
        }

        if (memberRes.rows[0].role === 'owner') {
            throw new Error("Owner cannot leave the group");
        }

        // Check active members count
        const countRes = await client.query(
            "SELECT COUNT(*) as count FROM group_members WHERE group_id = $1 AND status = 'active'",
            [groupId]
        );
        const currentCount = parseInt(countRes.rows[0].count);

        if (currentCount <= 2) {
            throw new Error("Group cannot have fewer than 2 members");
        }

        await client.query(
            "UPDATE group_members SET status = 'left' WHERE group_id = $1 AND user_id = $2",
            [groupId, userId]
        );

        await client.query('COMMIT');
    } catch (e) {
        await client.query('ROLLBACK');
        throw e;
    } finally {
        client.release();
    }
}

export async function saveGroupMessage(groupId: string, senderId: string, content: string): Promise<GroupMessage> {
    // Verify membership
    const member = await getGroupMember(groupId, senderId);
    if (!member || member.status !== 'active') {
        throw new Error("You are not a participant of this group");
    }

    const res = await pool.query(`
        INSERT INTO group_messages (group_id, sender_id, content)
        VALUES ($1, $2, $3)
        RETURNING *
     `, [groupId, senderId, content]);

    const msg = res.rows[0];

    // Fetch sender details for UI
    const userRes = await pool.query('SELECT first_name, last_name FROM users WHERE id = $1', [senderId]);
    return {
        ...msg,
        sender_first_name: userRes.rows[0]?.first_name,
        sender_last_name: userRes.rows[0]?.last_name
    };
}

export async function markGroupRead(groupId: string, userId: string): Promise<number> {
    // Insert into group_message_reads all messages in this group that this user hasn't read
    // where sender != user
    const query = `
        INSERT INTO group_message_reads (message_id, user_id, read_at)
        SELECT id, $2, NOW()
        FROM group_messages
        WHERE group_id = $1
          AND sender_id != $2
          AND id NOT IN (
              SELECT message_id FROM group_message_reads WHERE user_id = $2
          )
        ON CONFLICT (message_id, user_id) DO NOTHING
    `;
    const res = await pool.query(query, [groupId, userId]);
    return res.rowCount || 0;
}

export async function getUserGroups(userId: string): Promise<Group[]> {
    // Get groups where user is active member
    const query = `
        SELECT g.*,
        (
            SELECT COUNT(*) 
            FROM group_messages m 
            WHERE m.group_id = g.id 
            AND m.sender_id != $1
            AND m.id NOT IN (SELECT message_id FROM group_message_reads WHERE user_id = $1)
        )::int as unread_count,
        (
             SELECT json_build_object(
                 'content', m.content, 
                 'created_at', m.created_at,
                 'sender_first_name', u.first_name,
                 'sender_last_name', u.last_name
             )
             FROM group_messages m
             JOIN users u ON m.sender_id = u.id
             WHERE m.group_id = g.id
             ORDER BY m.created_at DESC
             LIMIT 1
        ) as last_message
        FROM groups g
        JOIN group_members gm ON g.id = gm.group_id
        WHERE gm.user_id = $1 AND gm.status = 'active'
        ORDER BY (
            SELECT MAX(created_at) FROM group_messages WHERE group_id = g.id
        ) DESC NULLS LAST
    `;
    const res = await pool.query(query, [userId]);
    return res.rows;
}

export async function getGroupMessages(groupId: string, userId: string, limit = 50, offset = 0): Promise<GroupMessage[]> {
    // Verify membership
    const member = await getGroupMember(groupId, userId);
    if (!member || member.status !== 'active') {
        throw new Error("Not a member");
    }

    const groupRes = await pool.query('SELECT type FROM groups WHERE id = $1', [groupId]);
    const groupType = groupRes.rows[0]?.type;

    let query: string;
    if (groupType === 'event') {
        query = `
            SELECT m.*, u.first_name as sender_first_name, u.last_name as sender_last_name,
            (
                EXISTS (SELECT 1 FROM event_admins ea JOIN events e ON ea.event_id = e.id WHERE e.group_id = $1 AND ea.user_id = m.sender_id)
                OR
                EXISTS (SELECT 1 FROM event_organizers eo JOIN events e ON eo.event_id = e.id WHERE e.group_id = $1 AND eo.user_id = m.sender_id)
            ) as is_organizer
            FROM group_messages m
            JOIN users u ON m.sender_id = u.id
            WHERE m.group_id = $1
            ORDER BY m.created_at ASC
            LIMIT $2 OFFSET $3
        `;
    } else {
        query = `
            SELECT m.*, u.first_name as sender_first_name, u.last_name as sender_last_name,
            false as is_organizer
            FROM group_messages m
            JOIN users u ON m.sender_id = u.id
            WHERE m.group_id = $1
            ORDER BY m.created_at ASC
            LIMIT $2 OFFSET $3
        `;
    }
    const res = await pool.query(query, [groupId, limit, offset]);
    return res.rows;
}

export async function getGroupUnreadSummary(userId: string): Promise<{ totalUnread: number, groups: { groupId: string, unreadCount: number }[] }> {
    const query = `
        SELECT 
            m.group_id, 
            COUNT(m.id)::int as unread_count
        FROM group_messages m
        JOIN group_members gm ON m.group_id = gm.group_id
        WHERE gm.user_id = $1 
          AND gm.status = 'active'
          AND m.sender_id != $1
          AND m.id NOT IN (
              SELECT message_id FROM group_message_reads WHERE user_id = $1
          )
        GROUP BY m.group_id
     `;
    const res = await pool.query(query, [userId]);

    const totalUnread = res.rows.reduce((sum, row) => sum + row.unread_count, 0);
    const groups = res.rows.map(r => ({ groupId: r.group_id, unreadCount: r.unread_count }));

    return { totalUnread, groups };
}
