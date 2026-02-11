import { pool } from './pool';

export interface Opening {
    id: string;
    body_id: string;
    title: string;
    description: string;
    location_city: string;
    location_country: string;
    job_type: string;
    experience_level: string;
    created_at: string;
    updated_at: string;
    body_name?: string;
}

export async function createOpening(data: Omit<Opening, 'id' | 'created_at' | 'updated_at'>): Promise<Opening> {
    const { body_id, title, description, location_city, location_country, job_type, experience_level } = data;
    const res = await pool.query(
        `INSERT INTO openings (body_id, title, description, location_city, location_country, job_type, experience_level)
         VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
        [body_id, title, description, location_city, location_country, job_type, experience_level]
    );
    return res.rows[0];
}

export async function listOpenings(filters: { body_id?: string, job_type?: string, experience_level?: string } = {}): Promise<Opening[]> {
    let query = 'SELECT o.*, b.name as body_name FROM openings o JOIN bodies b ON o.body_id = b.id WHERE 1=1';
    const params: any[] = [];

    if (filters.body_id) {
        params.push(filters.body_id);
        query += ` AND o.body_id = $${params.length}`;
    }
    if (filters.job_type) {
        params.push(filters.job_type);
        query += ` AND o.job_type = $${params.length}`;
    }
    if (filters.experience_level) {
        params.push(filters.experience_level);
        query += ` AND o.experience_level = $${params.length}`;
    }

    query += ' ORDER BY o.created_at DESC';
    const res = await pool.query(query, params);
    return res.rows;
}

export async function getOpening(id: string): Promise<Opening | null> {
    const res = await pool.query(
        'SELECT o.*, b.name as body_name FROM openings o JOIN bodies b ON o.body_id = b.id WHERE o.id = $1',
        [id]
    );
    return res.rows[0] || null;
}

export async function updateOpening(id: string, data: Partial<Omit<Opening, 'id' | 'created_at' | 'updated_at'>>): Promise<Opening | null> {
    const fields: string[] = [];
    const values: any[] = [];
    let i = 1;

    for (const [key, value] of Object.entries(data)) {
        if (value !== undefined) {
            fields.push(`${key} = $${i++}`);
            values.push(value);
        }
    }

    if (fields.length === 0) return getOpening(id);

    values.push(id);
    const query = `UPDATE openings SET ${fields.join(', ')}, updated_at = NOW() WHERE id = $${i} RETURNING *`;
    const res = await pool.query(query, values);
    return res.rows[0] || null;
}

export async function deleteOpening(id: string): Promise<void> {
    await pool.query('DELETE FROM openings WHERE id = $1', [id]);
}
