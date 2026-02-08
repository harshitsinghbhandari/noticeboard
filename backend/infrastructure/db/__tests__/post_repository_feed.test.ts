import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getAggregatedFeed } from '../post_repository';
import { pool } from '../pool';

vi.mock('../pool', () => ({
    pool: {
        query: vi.fn(),
    },
}));

describe('post_repository aggregated feed', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should fetch aggregated feed', async () => {
        const mockFeed = [{ id: '1', type: 'post' }, { id: '2', type: 'opening' }];
        (pool.query as any).mockResolvedValue({ rows: mockFeed });

        const feed = await getAggregatedFeed('u1');
        expect(feed).toEqual(mockFeed);
        expect(pool.query).toHaveBeenCalledWith(expect.stringContaining('UNION ALL'), expect.any(Array));
    });
});
