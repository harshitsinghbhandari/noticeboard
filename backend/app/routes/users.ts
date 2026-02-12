import { Router } from 'express';
import { authMiddleware } from '../../infrastructure/http/auth_middleware';
import { getUser, searchUsers } from '../../infrastructure/db/user_repository';
import { getProfile, upsertProfile } from '../../infrastructure/db/profile_repository';
import { listUserPosts } from '../../infrastructure/db/post_repository';

import { pool } from '../../infrastructure/db/pool';
import { isBlocked } from '../../infrastructure/db/blocking_repository';

const router = Router();

router.get('/users/search', authMiddleware, async (req, res) => {
    const query = req.query.q as string;
    if (!query || query.length < 2) {
        return res.json([]);
    }
    try {
        const users = await searchUsers(query);
        res.json(users);
    } catch (error) {
        console.error('Search users error', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

router.get('/me', authMiddleware, async (req, res) => {
    if (!req.user) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
    }

    try {
        const user = await getUser(req.user.id);
        if (!user) {
            res.status(404).json({ error: 'User not found' });
            return;
        }
        res.json(user);
    } catch (error) {
        console.error('Failed to fetch user', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

router.get('/me/profile', authMiddleware, async (req, res) => {
    if (!req.user) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
    }
    try {
        const profile = await getProfile(req.user.id);
        res.json(profile || { about: null });
    } catch (error) {
        console.error('Failed to fetch profile', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

router.put('/me/profile', authMiddleware, async (req, res) => {
    if (!req.user) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
    }

    const { about } = req.body;

    if (typeof about !== 'string') {
        res.status(400).json({ error: 'About must be a string' });
        return;
    }

    try {
        await upsertProfile(req.user.id, about);
        const updatedProfile = await getProfile(req.user.id);
        res.json(updatedProfile);
    } catch (error) {
        console.error('Failed to update profile', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

router.get('/users/:id/posts', authMiddleware, async (req, res) => {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
    const { id } = req.params;

    // Minimal polish: allow users to list their own posts for profile.
    if (id !== req.user.id) {
        return res.status(403).json({ error: 'Viewing other profiles not fully implemented yet' });
    }

    try {
        const posts = await listUserPosts(id);
        res.json(posts);
    } catch (error) {
        console.error('List user posts error', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

router.get('/users/:id', authMiddleware, async (req, res) => {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
    const id = req.params.id as string;

    if (typeof id !== 'string') {
        return res.status(400).json({ error: 'Invalid ID' });
    }

    try {
        const user = await getUser(id);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Fetch additional context regarding the requester
        const requesterId = req.user.id;

        // Check blocking
        const blocked = await isBlocked(requesterId, id);

        // Check connection header details if needed, but for now just raw status
        // We need to know if *I* blocked *them* specifically to show "Unblock", 
        // but the requirement "isBlocked" generally means no interaction.
        // Let's get specific block direction if possible, or just general "blocked".
        // The implementation plan says "is_blocked", let's stick to that boolean for now to hide buttons.

        // Get connection status
        // We can reuse listConnections logic or just query directly.
        // Let's do a quick query here or import a helper from connection_repo if it existed (it has getConnection but by ID).
        // Let's add a quick query here for simplicity or import a proper one.
        // Actually, let's use a raw query here to be fast and precise.

        // We need:
        // 1. connection_status: 'pending', 'accepted', 'rejected', or null
        // 2. is_blocked: boolean

        const connQuery = `
            SELECT status, requester_id
            FROM connections
            WHERE (requester_id = $1 AND receiver_id = $2)
               OR (requester_id = $2 AND receiver_id = $1)
        `;
        const connRes = await pool.query(connQuery, [requesterId, id]);
        let connection_status = null;
        let is_connection_sender = false;

        if (connRes.rows.length > 0) {
            connection_status = connRes.rows[0].status;
            is_connection_sender = connRes.rows[0].requester_id === requesterId;
        }

        res.json({
            ...user,
            connection_status,
            is_connection_sender,
            is_blocked: blocked
        });
    } catch (error) {
        console.error('Get user error', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

import { blockUser, unblockUser } from '../../infrastructure/db/blocking_repository';
import { createReport } from '../../infrastructure/db/reporting_repository';

// Block User
router.post('/users/:id/block', authMiddleware, async (req, res) => {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
    const id = req.params.id as string;

    if (id === req.user.id) {
        return res.status(400).json({ error: 'Cannot block self' });
    }

    try {
        await blockUser(req.user.id, id);
        res.json({ status: 'blocked' });
    } catch (error: any) {
        console.error('Block user error', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Unblock User
router.delete('/users/:id/block', authMiddleware, async (req, res) => {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
    const id = req.params.id as string;

    try {
        await unblockUser(req.user.id, id);
        res.json({ status: 'unblocked' });
    } catch (error: any) {
        console.error('Unblock user error', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Report User
router.post('/users/:id/report', authMiddleware, async (req, res) => {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
    const id = req.params.id as string;
    const { reason } = req.body;

    if (!reason || typeof reason !== 'string') {
        return res.status(400).json({ error: 'Reason is required' });
    }

    try {
        await createReport(req.user.id, id, reason);
        res.json({ status: 'reported' });
    } catch (error: any) {
        console.error('Report user error', error);
        if (error.message.includes('already have an open report')) {
            res.status(409).json({ error: error.message });
        } else {
            res.status(500).json({ error: 'Internal server error' });
        }
    }
});

export default router;
