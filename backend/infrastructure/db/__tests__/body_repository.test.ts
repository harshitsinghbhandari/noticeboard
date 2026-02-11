import { describe, it, expect, vi, beforeEach } from 'vitest';
import { listBodies } from '../body_repository';
import { pool } from '../pool';

vi.mock('../pool', () => ({
    pool: {
        query: vi.fn(),
    },
}));

describe('body_repository', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should list bodies', async () => {
        const mockBodies = [{ id: '1', name: 'Body A' }, { id: '2', name: 'Body B' }];
        (pool.query as any).mockResolvedValue({ rows: mockBodies });

        const bodies = await listBodies();
        expect(bodies).toEqual(mockBodies);
        expect(pool.query).toHaveBeenCalledWith(expect.stringContaining('SELECT * FROM bodies'));
    });
});
