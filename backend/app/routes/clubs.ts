import { Router } from 'express';
import { authMiddleware, requireRole } from '../../infrastructure/http/auth_middleware';
import { listClubs, listFollowedClubs, createClub, getClub, updateClub, deleteClub, isFollowingClub, followClub, unfollowClub } from '../../infrastructure/db/club_repository';
import { listPosts } from '../../infrastructure/db/post_repository';
import { body, validationResult } from 'express-validator';

const router = Router();

router.get('/', authMiddleware, async (req, res) => {
    try {
        const clubs = await listClubs();
        res.json(clubs);
    } catch (error) {
        console.error('List clubs error', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

router.get('/followed', authMiddleware, async (req, res) => {
    try {
        const clubs = await listFollowedClubs(req.user!.id);
        res.json(clubs);
    } catch (error) {
        console.error('List followed clubs error', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

router.post('/',
    authMiddleware,
    requireRole('CLUB_ADMIN'),
    body('name').notEmpty().withMessage('Name is required'),
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        const { name, description, website_url } = req.body;
        try {
            const club = await createClub(name, description, req.user!.id, website_url);
            res.status(201).json(club);
        } catch (error) {
            console.error('Create club error', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    });

router.put('/:id',
    authMiddleware,
    requireRole('CLUB_ADMIN'),
    body('name').notEmpty().withMessage('Name is required'),
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        const { name, description, website_url } = req.body;
        try {
            const existingClub = await getClub(req.params.id as string);
            if (!existingClub) return res.status(404).json({ error: 'Club not found' });
            if (existingClub.admin_id !== req.user!.id) {
                return res.status(403).json({ error: 'Forbidden: You are not the admin of this club' });
            }

            const club = await updateClub(req.params.id as string, name, description, website_url);
            res.json(club);
        } catch (error) {
            console.error('Update club error', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }
);

router.delete('/:id', authMiddleware, requireRole('CLUB_ADMIN'), async (req, res) => {
    try {
        const existingClub = await getClub(req.params.id as string);
        if (!existingClub) return res.status(404).json({ error: 'Club not found' });
        if (existingClub.admin_id !== req.user!.id) {
            return res.status(403).json({ error: 'Forbidden: You are not the admin of this club' });
        }

        await deleteClub(req.params.id as string);
        res.status(204).send();
    } catch (error) {
        console.error('Delete club error', error);
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
        console.error('List club posts error', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

router.get('/:id', authMiddleware, async (req, res) => {
    try {
        const club = await getClub(req.params.id as string);
        if (!club) return res.status(404).json({ error: 'Club not found' });

        const isFollowing = await isFollowingClub(club.id, req.user!.id);
        res.json({ ...club, is_following: isFollowing });
    } catch (error) {
        console.error('Get club error', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

router.post('/:id/follow', authMiddleware, async (req, res) => {
    try {
        await followClub(req.params.id as string, req.user!.id);
        res.json({ status: 'followed' });
    } catch (error) {
        console.error('Follow club error', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

router.delete('/:id/follow', authMiddleware, async (req, res) => {
    try {
        await unfollowClub(req.params.id as string, req.user!.id);
        res.json({ status: 'unfollowed' });
    } catch (error) {
        console.error('Unfollow club error', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

export default router;
