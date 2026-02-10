import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import app from '../server';
import * as clubRepo from '../../infrastructure/db/club_repository';

// Mock auth middleware to bypass real Keycloak
vi.mock('../../infrastructure/http/auth_middleware', () => ({
    authMiddleware: vi.fn((req: any, res: any, next: any) => {
        req.user = { id: 'u1', email: 'test@example.com', first_name: 'Test', last_name: 'User', roles: ['USER'] };
        next();
    }),
    requireRole: vi.fn((role: string) => (req: any, res: any, next: any) => {
        if (req.user && req.user.roles.includes(role)) next();
        else res.status(403).json({ error: 'Forbidden' });
    })
}));

vi.mock('../../infrastructure/db/club_repository');

describe('Clubs API', () => {
    it('GET /clubs should return list of clubs', async () => {
        const mockClubs = [{ id: '1', name: 'Club 1' }];
        (clubRepo.listClubs as any).mockResolvedValue(mockClubs);

        const res = await request(app).get('/clubs');
        expect(res.status).toBe(200);
        expect(res.body).toEqual(mockClubs);
    });

    it('POST /clubs should fail if not CLUB_ADMIN', async () => {
        const res = await request(app).post('/clubs').send({ name: 'New Club' });
        expect(res.status).toBe(403);
    });
});
