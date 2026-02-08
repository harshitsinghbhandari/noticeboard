import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createClub, listClubs } from '../club_repository';
import { pool } from '../pool';

vi.mock('../pool', () => ({
    pool: {
        query: vi.fn(),
    },
}));

describe('club_repository', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should create a club', async () => {
        const mockClub = { id: '1', name: 'Test Club', description: 'Test Desc' };
        (pool.query as any).mockResolvedValue({ rows: [mockClub] });

        const club = await createClub('Test Club', 'Test Desc');
        expect(club).toEqual(mockClub);
        expect(pool.query).toHaveBeenCalledWith(
            expect.stringContaining('INSERT INTO clubs'),
            ['Test Club', 'Test Desc', undefined]
        );
    });

    it('should list clubs', async () => {
        const mockClubs = [{ id: '1', name: 'Club A' }, { id: '2', name: 'Club B' }];
        (pool.query as any).mockResolvedValue({ rows: mockClubs });

        const clubs = await listClubs();
        expect(clubs).toEqual(mockClubs);
        expect(pool.query).toHaveBeenCalledWith(expect.stringContaining('SELECT * FROM clubs'));
    });
});
