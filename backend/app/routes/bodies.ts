import { Router } from 'express';
import { authMiddleware } from '../../infrastructure/http/auth_middleware';
import { BodyService } from '../services/body_service';
import { body, validationResult } from 'express-validator';

const router = Router();

// Create Body (System Admin Only)
router.post('/',
    authMiddleware,
    body('name').notEmpty().withMessage('Name is required'),
    body('initial_admin_id').notEmpty().withMessage('Initial admin is required'),
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        try {
            const bodyObj = await BodyService.createBody(req.user!.id, req.body);
            res.status(201).json(bodyObj);
        } catch (error: any) {
            console.error('Create body error', error);
            if (error.message.startsWith('Forbidden')) {
                res.status(403).json({ error: error.message });
            } else if (error.message === 'Missing required fields' || error.message === 'Initial admin user not found') {
                res.status(400).json({ error: error.message });
            } else {
                res.status(500).json({ error: 'Internal server error' });
            }
        }
    }
);

router.get('/', authMiddleware, async (req, res) => {
    try {
        const bodies = await BodyService.listAll();
        res.json(bodies);
    } catch (error) {
        console.error('List bodies error', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

router.get('/followed', authMiddleware, async (req, res) => {
    try {
        const bodies = await BodyService.listFollowed(req.user!.id);
        res.json(bodies);
    } catch (error) {
        console.error('List followed bodies error', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

router.get('/:id', authMiddleware, async (req, res) => {
    try {
        const bodyObj = await BodyService.getBody(req.params.id, req.user!.id);
        if (!bodyObj) return res.status(404).json({ error: 'Body not found' });
        res.json(bodyObj);
    } catch (error) {
        console.error('Get body error', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

router.put('/:id',
    authMiddleware,
    body('name').notEmpty().withMessage('Name is required'),
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        try {
            const bodyObj = await BodyService.updateBody(req.user!.id, req.params.id, req.body);
            res.json(bodyObj);
        } catch (error: any) {
            console.error('Update body error', error);
            if (error.message.startsWith('Forbidden')) {
                res.status(403).json({ error: error.message });
            } else if (error.message === 'Name is required') {
                res.status(400).json({ error: error.message });
            } else {
                res.status(500).json({ error: 'Internal server error' });
            }
        }
    }
);

router.delete('/:id', authMiddleware, async (req, res) => {
    try {
        await BodyService.deleteBody(req.user!.id, req.params.id);
        res.status(204).send();
    } catch (error: any) {
        console.error('Delete body error', error);
        if (error.message.startsWith('Forbidden')) {
            res.status(403).json({ error: error.message });
        } else {
            res.status(500).json({ error: 'Internal server error' });
        }
    }
});

router.get('/:id/posts', authMiddleware, async (req, res) => {
    const limit = req.query.limit ? parseInt(req.query.limit as any) : 20;
    const cursor = req.query.cursor as any;
    try {
        const posts = await BodyService.listBodyPosts(req.user!.id, req.params.id, limit, cursor);
        res.json(posts);
    } catch (error) {
        console.error('List body posts error', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

router.get('/:id/events', authMiddleware, async (req, res) => {
    try {
        const events = await BodyService.listBodyEvents(req.params.id);
        res.json(events);
    } catch (error) {
        console.error('List body events error', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

router.post('/:id/follow', authMiddleware, async (req, res) => {
    try {
        await BodyService.followBody(req.params.id, req.user!.id);
        res.json({ status: 'followed' });
    } catch (error) {
        console.error('Follow body error', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

router.delete('/:id/follow', authMiddleware, async (req, res) => {
    try {
        await BodyService.unfollowBody(req.params.id, req.user!.id);
        res.json({ status: 'unfollowed' });
    } catch (error) {
        console.error('Unfollow body error', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

router.get('/:id/members', authMiddleware, async (req, res) => {
    try {
        const members = await BodyService.listMembers(req.user!.id, req.params.id);
        res.json(members);
    } catch (error: any) {
        console.error('List members error', error);
        if (error.message.startsWith('Forbidden')) {
            res.status(403).json({ error: error.message });
        } else {
            res.status(500).json({ error: 'Internal server error' });
        }
    }
});

router.post('/:id/members',
    authMiddleware,
    body('user_id').notEmpty(),
    body('role').isIn(['BODY_ADMIN', 'BODY_MANAGER', 'BODY_MEMBER']),
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        try {
            await BodyService.addMember(req.user!.id, req.params.id, req.body);
            res.status(201).json({ status: 'member added' });
        } catch (error: any) {
            console.error('Add member error', error);
            if (error.message.startsWith('Forbidden')) {
                res.status(403).json({ error: error.message });
            } else if (error.message === 'Missing required fields') {
                res.status(400).json({ error: error.message });
            } else {
                res.status(500).json({ error: 'Internal server error' });
            }
        }
    }
);

router.put('/:id/members/:userId',
    authMiddleware,
    body('role').isIn(['BODY_ADMIN', 'BODY_MANAGER', 'BODY_MEMBER']),
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        try {
            await BodyService.updateMemberRole(req.user!.id, req.params.id, req.params.userId, req.body.role);
            res.json({ status: 'role updated' });
        } catch (error: any) {
            console.error('Update member role error', error);
            if (error.message.startsWith('Forbidden')) {
                res.status(403).json({ error: error.message });
            } else if (error.message === 'Cannot demote the last administrator') {
                res.status(400).json({ error: error.message });
            } else {
                res.status(500).json({ error: 'Internal server error' });
            }
        }
    }
);

router.delete('/:id/members/:userId', authMiddleware, async (req, res) => {
    try {
        await BodyService.removeMember(req.user!.id, req.params.id, req.params.userId);
        res.status(204).send();
    } catch (error: any) {
        console.error('Remove member error', error);
        if (error.message.startsWith('Forbidden')) {
            res.status(403).json({ error: error.message });
        } else if (error.message === 'Cannot remove the last administrator') {
            res.status(400).json({ error: error.message });
        } else {
            res.status(500).json({ error: 'Internal server error' });
        }
    }
});

export default router;
