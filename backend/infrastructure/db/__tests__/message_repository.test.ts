import { describe, it, expect, vi, beforeEach } from 'vitest';
import { sendMessage, getChat } from '../message_repository';
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
        (pool.query as any).mockResolvedValue({ rows: [mockMsg] });

        const msg = await sendMessage('u1', 'u2', 'Hello');
        expect(msg).toEqual(mockMsg);
    });
});
