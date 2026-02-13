import { Router } from 'express';
import { authMiddleware } from '../../infrastructure/http/auth_middleware';
import { UserService } from '../services/user_service';

const router = Router();

router.get('/users/search', authMiddleware, async (req, res) => {
    try {
        const users = await UserService.search(req.query.q as string);
        res.json(users);
    } catch (error) {
        console.error('Search users error', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

router.get('/me', authMiddleware, async (req, res) => {
    try {
        const user = await UserService.getUser(req.user!.id);
        res.json(user);
    } catch (error: any) {
        console.error('Failed to fetch user', error);
        if (error.message === 'User not found') {
            res.status(404).json({ error: error.message });
        } else {
            res.status(500).json({ error: 'Internal server error' });
        }
    }
});

router.get('/me/profile', authMiddleware, async (req, res) => {
    try {
        const profile = await UserService.getProfile(req.user!.id);
        res.json(profile);
    } catch (error) {
        console.error('Failed to fetch profile', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

router.put('/me/profile', authMiddleware, async (req, res) => {
    try {
        const updatedProfile = await UserService.updateProfile(req.user!.id, req.body.about);
        res.json(updatedProfile);
    } catch (error: any) {
        console.error('Failed to update profile', error);
        if (error.message === 'About must be a string') {
            res.status(400).json({ error: error.message });
        } else {
            res.status(500).json({ error: 'Internal server error' });
        }
    }
});

router.get('/users/:id/posts', authMiddleware, async (req, res) => {
    try {
        const posts = await UserService.listUserPosts(req.user!.id, req.params.id);
        res.json(posts);
    } catch (error: any) {
        console.error('List user posts error', error);
        if (error.message.startsWith('Forbidden')) {
            res.status(403).json({ error: error.message });
        } else {
            res.status(500).json({ error: 'Internal server error' });
        }
    }
});

router.get('/users/:id', authMiddleware, async (req, res) => {
    try {
        const userContext = await UserService.getUserWithContext(req.user!.id, req.params.id);
        res.json(userContext);
    } catch (error: any) {
        console.error('Get user error', error);
        if (error.message === 'User not found') {
            res.status(404).json({ error: error.message });
        } else {
            res.status(500).json({ error: 'Internal server error' });
        }
    }
});

router.post('/users/:id/block', authMiddleware, async (req, res) => {
    try {
        await UserService.blockUser(req.user!.id, req.params.id);
        res.json({ status: 'blocked' });
    } catch (error: any) {
        console.error('Block user error', error);
        if (error.message === 'Cannot block self') {
            res.status(400).json({ error: error.message });
        } else {
            res.status(500).json({ error: 'Internal server error' });
        }
    }
});

router.delete('/users/:id/block', authMiddleware, async (req, res) => {
    try {
        await UserService.unblockUser(req.user!.id, req.params.id);
        res.json({ status: 'unblocked' });
    } catch (error) {
        console.error('Unblock user error', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

router.post('/users/:id/report', authMiddleware, async (req, res) => {
    try {
        await UserService.reportUser(req.user!.id, req.params.id, req.body.reason);
        res.json({ status: 'reported' });
    } catch (error: any) {
        console.error('Report user error', error);
        if (error.message === 'Reason is required') {
            res.status(400).json({ error: error.message });
        } else if (error.message.includes('already have an open report')) {
            res.status(409).json({ error: error.message });
        } else {
            res.status(500).json({ error: 'Internal server error' });
        }
    }
});

export default router;
