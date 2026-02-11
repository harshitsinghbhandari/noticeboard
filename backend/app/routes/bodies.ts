import { Router } from 'express';
import { authMiddleware } from '../../infrastructure/http/auth_middleware';
import {
    listBodies,
    listFollowedBodies,
    getBody,
    updateBody,
    deleteBody,
    isFollowingBody,
    followBody,
    unfollowBody,
    listMembers,
    addMember,
    removeMember,
    getMemberRole,
    countAdmins,
    checkBodyPermission,
    BodyAction
} from '../../infrastructure/db/body_repository';
import { listPosts } from '../../infrastructure/db/post_repository';
import { body, validationResult } from 'express-validator';

const router = Router();

router.get('/', authMiddleware, async (req, res) => {
    try {
        const bodies = await listBodies();
        res.json(bodies);
    } catch (error) {
        console.error('List bodies error', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

router.get('/followed', authMiddleware, async (req, res) => {
    try {
        const bodies = await listFollowedBodies(req.user!.id);
        res.json(bodies);
    } catch (error) {
        console.error('List followed bodies error', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

router.get('/:id', authMiddleware, async (req, res) => {
    try {
        const bodyObj = await getBody(req.params.id as string);
        if (!bodyObj) return res.status(404).json({ error: 'Body not found' });

        const isFollowing = await isFollowingBody(bodyObj.id, req.user!.id);
        const userRole = await getMemberRole(bodyObj.id, req.user!.id);
        res.json({ ...bodyObj, is_following: isFollowing, user_role: userRole });
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
        const { name, description, website_url } = req.body;
        try {
            const hasPermission = await checkBodyPermission(req.user!.id, req.params.id as string, BodyAction.EDIT_BODY);
            if (!hasPermission) {
                return res.status(403).json({ error: 'Forbidden: You do not have permission to edit this body' });
            }

            const bodyObj = await updateBody(req.params.id as string, name, description, website_url);
            res.json(bodyObj);
        } catch (error) {
            console.error('Update body error', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }
);

router.delete('/:id', authMiddleware, async (req, res) => {
    try {
        const hasPermission = await checkBodyPermission(req.user!.id, req.params.id as string, BodyAction.DELETE_BODY);
        if (!hasPermission) {
            return res.status(403).json({ error: 'Forbidden: You do not have permission to delete this body' });
        }

        await deleteBody(req.params.id as string);
        res.status(204).send();
    } catch (error) {
        console.error('Delete body error', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

router.get('/:id/posts', authMiddleware, async (req, res) => {
    const limit = req.query.limit ? parseInt(req.query.limit as any) : 20;
    const cursor = req.query.cursor as any;
    try {
        const posts = await listPosts(req.user!.id, limit, cursor, req.params.id as string);
        res.json(posts);
    } catch (error) {
        console.error('List body posts error', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

router.post('/:id/follow', authMiddleware, async (req, res) => {
    try {
        await followBody(req.params.id as string, req.user!.id);
        res.json({ status: 'followed' });
    } catch (error) {
        console.error('Follow body error', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

router.delete('/:id/follow', authMiddleware, async (req, res) => {
    try {
        await unfollowBody(req.params.id as string, req.user!.id);
        res.json({ status: 'unfollowed' });
    } catch (error) {
        console.error('Unfollow body error', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Member Management Routes

router.get('/:id/members', authMiddleware, async (req, res) => {
    try {
        const hasPermission = await checkBodyPermission(req.user!.id, req.params.id as string, BodyAction.MANAGE_MEMBERS);
        if (!hasPermission) {
            return res.status(403).json({ error: 'Forbidden: Only admins can view members list' });
        }
        const members = await listMembers(req.params.id as string);
        res.json(members);
    } catch (error) {
        console.error('List members error', error);
        res.status(500).json({ error: 'Internal server error' });
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
            const hasPermission = await checkBodyPermission(req.user!.id, req.params.id as string, BodyAction.MANAGE_MEMBERS);
            if (!hasPermission) {
                return res.status(403).json({ error: 'Forbidden: Only admins can add members' });
            }
            await addMember(req.params.id as string, req.body.user_id, req.body.role);
            res.status(201).json({ status: 'member added' });
        } catch (error) {
            console.error('Add member error', error);
            res.status(500).json({ error: 'Internal server error' });
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
            const hasPermission = await checkBodyPermission(req.user!.id, req.params.id as string, BodyAction.MANAGE_MEMBERS);
            if (!hasPermission) {
                return res.status(403).json({ error: 'Forbidden: Only admins can manage roles' });
            }

            // Safeguard: preventing removal of the last BODY_ADMIN
            const currentRole = await getMemberRole(req.params.id as string, req.params.userId as string);
            if (currentRole === 'BODY_ADMIN' && req.body.role !== 'BODY_ADMIN') {
                const adminCount = await countAdmins(req.params.id as string);
                if (adminCount <= 1) {
                    return res.status(400).json({ error: 'Cannot demote the last administrator' });
                }
            }

            await addMember(req.params.id as string, req.params.userId as string, req.body.role);
            res.json({ status: 'role updated' });
        } catch (error) {
            console.error('Update member role error', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }
);

router.delete('/:id/members/:userId', authMiddleware, async (req, res) => {
    try {
        const hasPermission = await checkBodyPermission(req.user!.id, req.params.id as string, BodyAction.MANAGE_MEMBERS);
        if (!hasPermission) {
            return res.status(403).json({ error: 'Forbidden: Only admins can remove members' });
        }

        // Safeguard: preventing removal of the last BODY_ADMIN
        const currentRole = await getMemberRole(req.params.id as string, req.params.userId as string);
        if (currentRole === 'BODY_ADMIN') {
            const adminCount = await countAdmins(req.params.id as string);
            if (adminCount <= 1) {
                return res.status(400).json({ error: 'Cannot remove the last administrator' });
            }
        }

        await removeMember(req.params.id as string, req.params.userId as string);
        res.status(204).send();
    } catch (error) {
        console.error('Remove member error', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

export default router;
