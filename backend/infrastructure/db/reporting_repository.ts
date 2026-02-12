import { pool } from './pool';

export async function createReport(reporterId: string, reportedId: string, reason: string): Promise<void> {
    if (reporterId === reportedId) {
        throw new Error('Cannot report self');
    }

    // Check for existing OPEN report
    const existingCheck = `
        SELECT id FROM user_reports
        WHERE reporter_id = $1 AND reported_id = $2 AND status = 'OPEN'
    `;
    const checkRes = await pool.query(existingCheck, [reporterId, reportedId]);
    if (checkRes.rowCount && checkRes.rowCount > 0) {
        throw new Error('You already have an open report for this user');
    }

    const query = `
        INSERT INTO user_reports (reporter_id, reported_id, reason)
        VALUES ($1, $2, $3)
    `;
    await pool.query(query, [reporterId, reportedId, reason]);
}
