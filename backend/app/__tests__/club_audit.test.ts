import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import app from '../server';
import * as clubRepo from '../../infrastructure/db/club_repository';
import * as openingRepo from '../../infrastructure/db/opening_repository';

// Mock auth middleware
vi.mock('../../infrastructure/http/auth_middleware', () => ({
    authMiddleware: vi.fn((req: any, res: any, next: any) => {
        // Default to a regular user
        req.user = { id: 'user-1', email: 'u1@example.com', first_name: 'U1', last_name: 'Last', roles: ['USER'] };
        next();
    }),
    requireRole: vi.fn((role: string) => (req: any, res: any, next: any) => {
        if (req.user && req.user.roles.includes(role)) next();
        else res.status(403).json({ error: 'Forbidden' });
    })
}));

vi.mock('../../infrastructure/db/club_repository');
vi.mock('../../infrastructure/db/opening_repository');
vi.mock('../../infrastructure/db/post_repository');
vi.mock('../../infrastructure/db/user_repository');

import { authMiddleware } from '../../infrastructure/http/auth_middleware';

describe('Club Audit - Security & Functionality', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('FIXED: Any CLUB_ADMIN can update ANY club (now restricted to admin_id)', async () => {
        const mockClub = { id: 'club-1', name: 'Club 1', admin_id: 'user-admin-1' };
        (clubRepo.updateClub as any).mockResolvedValue({ ...mockClub, name: 'Updated' });
        (clubRepo.getClub as any).mockResolvedValue(mockClub);

        // Simulate a DIFFERENT CLUB_ADMIN
        (authMiddleware as any).mockImplementationOnce((req: any, res: any, next: any) => {
            req.user = { id: 'user-admin-2', email: 'u2@example.com', roles: ['CLUB_ADMIN'] };
            next();
        });

        const res = await request(app).put('/clubs/club-1').send({ name: 'Updated' });

        // Now returns 403 Forbidden
        expect(res.status).toBe(403);
    });

    it('FIXED: Any CLUB_CONVENER can post as ANY club (now restricted to admin_id)', async () => {
        const mockClub = { id: 'club-not-mine', name: 'Other Club', admin_id: 'other-admin' };
        (clubRepo.getClub as any).mockResolvedValue(mockClub);

        // Simulate a CLUB_CONVENER who is NOT the admin
        (authMiddleware as any).mockImplementationOnce((req: any, res: any, next: any) => {
            req.user = { id: 'convener-1', email: 'c1@example.com', roles: ['CLUB_CONVENER'] };
            next();
        });

        const res = await request(app).post('/posts').send({
            content: 'Fake news from club',
            club_id: 'club-not-mine'
        });

        // Now returns 403 Forbidden
        expect(res.status).toBe(403);
    });

    it('FIXED: Club creation now records creator', async () => {
        (authMiddleware as any).mockImplementationOnce((req: any, res: any, next: any) => {
            req.user = { id: 'creator-1', email: 'c1@example.com', roles: ['CLUB_ADMIN'] };
            next();
        });

        (clubRepo.createClub as any).mockResolvedValue({ id: 'new-club', name: 'New Club' });

        await request(app).post('/clubs').send({ name: 'New Club' });

        // Verify if createClub was called with creator ID
        const call = (clubRepo.createClub as any).mock.calls[0];
        expect(call).toBeDefined();
        expect(call[2]).toBe('creator-1'); // Third argument is adminId
    });
});
