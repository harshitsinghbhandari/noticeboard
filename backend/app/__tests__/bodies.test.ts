import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import app from '../app';
import * as bodyRepo from '../../infrastructure/db/body_repository';

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

vi.mock('../../infrastructure/db/body_repository');

describe('Bodies API', () => {
    it('GET /bodies should return list of bodies', async () => {
        const mockBodies = [{ id: '1', name: 'Body 1' }];
        (bodyRepo.listBodies as any).mockResolvedValue(mockBodies);

        const res = await request(app).get('/bodies');
        expect(res.status).toBe(200);
        expect(res.body).toEqual(mockBodies);
    });

    it('POST /bodies should return 404 as it is removed', async () => {
        const res = await request(app).post('/bodies').send({ name: 'New Body' });
        expect(res.status).toBe(404);
    });
});
