import { pool } from './pool';
import { v4 as uuidv4 } from 'uuid';

export interface Event {
    id: string;
    body_id: string;
    group_id: string;
    title: string;
    description: string;
    location_name: string;
    latitude: number;
    longitude: number;
    start_time: Date;
    end_time: Date;
    capacity: number | null;
    status: 'draft' | 'published' | 'cancelled' | 'completed';
    created_at: Date;
    updated_at: Date;
    cancelled_at?: Date;
    body_name?: string;
}

export interface EventWithDistance extends Event {
    distance: number;
}

export async function createEvent(userId: string, data: any): Promise<Event> {
    const { bodyId, title, description, location_name, latitude, longitude, start_time, end_time, capacity } = data;
    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        const groupId = uuidv4();
        const maxMembers = capacity ? Math.min(capacity, 500) : 500;

        // 1. Create group
        await client.query(
            `INSERT INTO groups (id, name, description, created_by, type, max_members, is_active)
             VALUES ($1, $2, $3, $4, 'event', $5, true)`,
            [groupId, title, description, userId, maxMembers]
        );

        // 2. Insert event row
        const eventRes = await client.query(
            `INSERT INTO events (body_id, group_id, title, description, location_name, latitude, longitude, start_time, end_time, capacity, status)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'draft') RETURNING *`,
            [bodyId, groupId, title, description, location_name, latitude, longitude, start_time, end_time, capacity]
        );
        const event = eventRes.rows[0];

        // 3. Insert into group_members
        await client.query(
            `INSERT INTO group_members (group_id, user_id, role, status, acted_by)
             VALUES ($1, $2, 'owner', 'active', $2)`,
            [groupId, userId]
        );

        // 4. Insert into event_admins
        await client.query(
            `INSERT INTO event_admins (event_id, user_id) VALUES ($1, $2)`,
            [event.id, userId]
        );

        await client.query('COMMIT');
        return event;
    } catch (e) {
        await client.query('ROLLBACK');
        throw e;
    } finally {
        client.release();
    }
}

export async function listEvents(lat: number, lng: number, radius: number): Promise<EventWithDistance[]> {
    const query = `
        SELECT e.*, b.name as body_name, (
            6371 * acos(
                cos(radians($1)) * cos(radians(e.latitude)) *
                cos(radians(e.longitude) - radians($2)) +
                sin(radians($1)) * sin(radians(e.latitude))
            )
        ) AS distance
        FROM events e
        LEFT JOIN bodies b ON e.body_id = b.id
        WHERE e.status = 'published'
        AND (
            6371 * acos(
                cos(radians($1)) * cos(radians(e.latitude)) *
                cos(radians(e.longitude) - radians($2)) +
                sin(radians($1)) * sin(radians(e.latitude))
            )
        ) <= $3
        ORDER BY distance ASC
        LIMIT 50
    `;
    const res = await pool.query(query, [lat, lng, radius]);
    return res.rows;
}

export async function addEventAdmin(eventId: string, userId: string): Promise<void> {
    await pool.query(
        'INSERT INTO event_admins (event_id, user_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
        [eventId, userId]
    );
}

export async function addEventOrganizer(eventId: string, userId: string): Promise<void> {
    await pool.query(
        'INSERT INTO event_organizers (event_id, user_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
        [eventId, userId]
    );
}

export async function isEventAdmin(eventId: string, userId: string): Promise<boolean> {
    const res = await pool.query(
        'SELECT 1 FROM event_admins WHERE event_id = $1 AND user_id = $2',
        [eventId, userId]
    );
    return (res.rowCount ?? 0) > 0;
}

export async function isOrganizer(groupId: string, userId: string): Promise<boolean> {
    const res = await pool.query(
        `SELECT 1 FROM events e
         LEFT JOIN event_admins ea ON e.id = ea.event_id AND ea.user_id = $2
         LEFT JOIN event_organizers eo ON e.id = eo.event_id AND eo.user_id = $2
         WHERE e.group_id = $1 AND (ea.user_id IS NOT NULL OR eo.user_id IS NOT NULL)`,
        [groupId, userId]
    );
    return (res.rowCount ?? 0) > 0;
}

export async function getEvent(eventId: string): Promise<Event | null> {
    const res = await pool.query(
        'SELECT e.*, b.name as body_name FROM events e LEFT JOIN bodies b ON e.body_id = b.id WHERE e.id = $1',
        [eventId]
    );
    return res.rows[0] || null;
}

export async function getEventByGroupId(groupId: string): Promise<Event | null> {
    const res = await pool.query(
        'SELECT e.*, b.name as body_name FROM events e LEFT JOIN bodies b ON e.body_id = b.id WHERE e.group_id = $1',
        [groupId]
    );
    return res.rows[0] || null;
}

export async function getEventsByBodyId(bodyId: string): Promise<Event[]> {
    const res = await pool.query(
        "SELECT * FROM events WHERE body_id = $1 AND status != 'cancelled' ORDER BY start_time ASC",
        [bodyId]
    );
    return res.rows;
}

export async function updateEvent(eventId: string, data: any): Promise<Event> {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        const eventRes = await client.query('SELECT * FROM events WHERE id = $1 FOR UPDATE', [eventId]);
        if (eventRes.rows.length === 0) throw new Error('Event not found');
        const event = eventRes.rows[0];

        if (event.status !== 'draft' && event.status !== 'published') {
            throw new Error('Only draft or published events can be updated');
        }

        const { title, description, location_name, latitude, longitude, start_time, end_time, capacity } = data;

        if (capacity !== undefined && capacity !== event.capacity) {
            const countRes = await client.query(
                `SELECT COUNT(*) FROM group_members WHERE group_id = $1 AND status = 'active'`,
                [event.group_id]
            );
            if (parseInt(countRes.rows[0].count) > capacity) {
                throw new Error('New capacity cannot be less than current active members');
            }

            // Update group max_members as well
            const maxMembers = capacity ? Math.min(capacity, 500) : 500;
            await client.query(
                'UPDATE groups SET max_members = $1 WHERE id = $2',
                [maxMembers, event.group_id]
            );
        }

        const updatedEventRes = await client.query(
            `UPDATE events SET
                title = COALESCE($1, title),
                description = COALESCE($2, description),
                location_name = COALESCE($3, location_name),
                latitude = COALESCE($4, latitude),
                longitude = COALESCE($5, longitude),
                start_time = COALESCE($6, start_time),
                end_time = COALESCE($7, end_time),
                capacity = $8,
                updated_at = NOW()
             WHERE id = $9 RETURNING *`,
            [title, description, location_name, latitude, longitude, start_time, end_time, capacity === undefined ? event.capacity : capacity, eventId]
        );

        await client.query('COMMIT');
        return updatedEventRes.rows[0];
    } catch (e) {
        await client.query('ROLLBACK');
        throw e;
    } finally {
        client.release();
    }
}

export async function publishEvent(eventId: string): Promise<void> {
    const res = await pool.query(
        "UPDATE events SET status = 'published', updated_at = NOW() WHERE id = $1 AND status = 'draft'",
        [eventId]
    );
    if (res.rowCount === 0) {
        const event = await getEvent(eventId);
        if (!event) throw new Error('Event not found');
        if (event.status !== 'draft') throw new Error('Only draft events can be published');
    }
}

export async function cancelEvent(eventId: string): Promise<void> {
    const res = await pool.query(
        "UPDATE events SET status = 'cancelled', cancelled_at = NOW(), updated_at = NOW() WHERE id = $1 AND status = 'published'",
        [eventId]
    );
    if (res.rowCount === 0) {
        const event = await getEvent(eventId);
        if (!event) throw new Error('Event not found');
        if (event.status !== 'published') throw new Error('Only published events can be cancelled');
    }
}

export async function leaveEvent(userId: string, eventId: string): Promise<void> {
    const event = await getEvent(eventId);
    if (!event) throw new Error('Event not found');

    const memberRes = await pool.query(
        "SELECT role FROM group_members WHERE group_id = $1 AND user_id = $2 AND status = 'active'",
        [event.group_id, userId]
    );
    if (memberRes.rows.length === 0) throw new Error('Not an active member of this event');
    if (memberRes.rows[0].role === 'owner') throw new Error('Owner cannot leave the event');

    await pool.query(
        "UPDATE group_members SET status = 'left' WHERE group_id = $1 AND user_id = $2",
        [event.group_id, userId]
    );
}

export async function joinEvent(userId: string, eventId: string): Promise<void> {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        // 1. Fetch event and verify status
        const eventRes = await client.query('SELECT * FROM events WHERE id = $1', [eventId]);
        if (eventRes.rows.length === 0) throw new Error('Event not found');
        const event = eventRes.rows[0];
        if (event.status !== 'published') throw new Error('Event is not open for joining');

        // 2. Count active events for user
        const activeEventsRes = await client.query(
            `SELECT COUNT(*) FROM group_members gm
             JOIN events e ON gm.group_id = e.group_id
             WHERE gm.user_id = $1 AND gm.status = 'active' AND e.status IN ('published', 'completed')`,
            [userId]
        );
        if (parseInt(activeEventsRes.rows[0].count) >= 5) {
            throw new Error('You can only join up to 5 active events at a time');
        }

        // 3. Capacity check
        if (event.capacity !== null) {
            // Lock group_members for this group
            await client.query(
                `SELECT 1 FROM group_members WHERE group_id = $1 FOR UPDATE`,
                [event.group_id]
            );

            const countRes = await client.query(
                `SELECT COUNT(*) FROM group_members WHERE group_id = $1 AND status = 'active'`,
                [event.group_id]
            );
            if (parseInt(countRes.rows[0].count) >= event.capacity) {
                throw new Error('Event is full');
            }
        }

        // 4. Join event (insert/upsert into group_members)
        await client.query(
            `INSERT INTO group_members (group_id, user_id, role, status, acted_by)
             VALUES ($1, $2, 'member', 'active', $2)
             ON CONFLICT (group_id, user_id) DO UPDATE SET status = 'active', role = 'member'`,
            [event.group_id, userId]
        );

        await client.query('COMMIT');
    } catch (e) {
        await client.query('ROLLBACK');
        throw e;
    } finally {
        client.release();
    }
}
