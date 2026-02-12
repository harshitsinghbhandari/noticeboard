import { describe, it, expect, vi, beforeEach } from 'vitest';
import { sendMessage, markMessagesAsRead } from '../message_repository';
import { pool } from '../pool';

vi.mock('../pool', () => ({
    pool: {
        query: vi.fn(),
    },
}));

describe('message_repository', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should send a message', async () => {
        const mockMsg = { id: 'm1', message_text: 'Hello' };

        // Mock sequence:
        // 1. isBlocked -> false
        // 2. connection status -> 'accepted'
        // 3. existing messages -> rows.length > 0 (to skip rate limit)
        // 4. insert -> mockMsg
        (pool.query as any)
            .mockResolvedValueOnce({ rowCount: 0 }) // isBlocked
            .mockResolvedValueOnce({ rows: [{ status: 'accepted' }] }) // connection status
            .mockResolvedValueOnce({ rowCount: 1 }) // existing messages
            .mockResolvedValueOnce({ rows: [mockMsg] }); // insert

        const msg = await sendMessage('u1', 'u2', 'Hello');
        expect(msg).toEqual(mockMsg);
    });

    it('should mark messages as read and return IDs', async () => {
        const mockIds = ['m1', 'm2'];
        (pool.query as any).mockResolvedValue({ rows: mockIds.map(id => ({ id })) });

        const ids = await markMessagesAsRead('receiver', 'sender');
        expect(ids).toEqual(mockIds);
        expect(pool.query).toHaveBeenCalledWith(
            expect.stringContaining('UPDATE messages SET read_at = NOW()'),
            ['receiver', 'sender']
        );
        expect(pool.query).toHaveBeenCalledWith(
            expect.stringContaining('RETURNING id'),
            expect.anything()
        );
    });
});
