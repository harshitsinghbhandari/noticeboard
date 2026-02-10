import { Router } from 'express';
import { authMiddleware } from '../../infrastructure/http/auth_middleware';
import { getUser } from '../../infrastructure/db/user_repository';
import { getProfile, upsertProfile } from '../../infrastructure/db/profile_repository';
import { listUserPosts } from '../../infrastructure/db/post_repository';

const router = Router();

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
    const { id } = req.params;

    if (typeof id !== 'string') {
        return res.status(400).json({ error: 'Invalid ID' });
    }

    try {
        const user = await getUser(id);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        res.json(user);
    } catch (error) {
        console.error('Get user error', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

export default router;
