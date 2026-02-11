import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createOpening, listOpenings } from '../opening_repository';
import { pool } from '../pool';

vi.mock('../pool', () => ({
    pool: {
        query: vi.fn(),
    },
}));

describe('opening_repository', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should create an opening', async () => {
        const mockOpening = { id: '1', title: 'Intern' };
        (pool.query as any).mockResolvedValue({ rows: [mockOpening] });

        const opening = await createOpening({
            body_id: 'c1',
            title: 'Intern',
            description: 'Desc',
            location_city: 'Mumbai',
            location_country: 'India',
            job_type: 'internship',
            experience_level: 'entry'
        });
        expect(opening).toEqual(mockOpening);
    });
});
