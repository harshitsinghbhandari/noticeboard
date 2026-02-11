import { Router } from 'express';
import { authMiddleware } from '../../infrastructure/http/auth_middleware';
import { createPost, getAggregatedFeed, getPost, addComment, listComments, addReaction, removeReaction } from '../../infrastructure/db/post_repository';
import { checkBodyPermission, BodyAction } from '../../infrastructure/db/body_repository';
import { createNotification } from '../../infrastructure/db/notification_repository';

const router = Router();

router.post('/', authMiddleware, async (req, res) => {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
    const { content, visibility, body_id } = req.body;

    if (!content || typeof content !== 'string') {
        return res.status(400).json({ error: 'Content is required' });
    }

    if (body_id) {
        const hasPermission = await checkBodyPermission(req.user.id, body_id, BodyAction.CREATE_POST);
        if (!hasPermission) {
            return res.status(403).json({ error: 'Forbidden: You are not authorized to post for this body' });
        }
    }

    const validVisibility = ['public', 'connections_only'];
    const postVisibility = (visibility && validVisibility.includes(visibility)) ? visibility : 'public';

    try {
        const post = await createPost(req.user.id, content, postVisibility, body_id);
        res.status(201).json(post);
    } catch (error) {
        console.error('Create post error', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

router.get('/', authMiddleware, async (req, res) => {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
    const limit = req.query.limit ? parseInt(req.query.limit as any) : 20;
    const cursor = req.query.cursor as any;

    try {
        const feed = await getAggregatedFeed(req.user.id, limit, cursor);
        res.json(feed);
    } catch (error) {
        console.error('List posts error', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

router.get('/:id', authMiddleware, async (req, res) => {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
    const { id } = req.params;

    if (typeof id !== 'string') {
        return res.status(400).json({ error: 'Invalid ID' });
    }

    try {
        const post = await getPost(id);
        if (!post) return res.status(404).json({ error: 'Post not found' });
        res.json(post);
    } catch (error) {
        console.error('Get post error', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

router.post('/:id/comments', authMiddleware, async (req, res) => {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
    const { id } = req.params;
    const { content } = req.body;

    if (typeof id !== 'string') {
        return res.status(400).json({ error: 'Invalid ID' });
    }

    if (!content || typeof content !== 'string') {
        return res.status(400).json({ error: 'Content is required' });
    }

    try {
        const comment = await addComment(id, req.user.id, content);

        // Notify post author
        const post = await getPost(id);
        if (post && post.author_id !== req.user.id) {
            await createNotification(post.author_id, 'comment', req.user.id, id);
        }

        res.status(201).json(comment);
    } catch (error) {
        console.error('Add comment error', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

router.get('/:id/comments', authMiddleware, async (req, res) => {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
    const { id } = req.params;

    if (typeof id !== 'string') {
        return res.status(400).json({ error: 'Invalid ID' });
    }

    try {
        const comments = await listComments(id);
        res.json(comments);
    } catch (error) {
        console.error('List comments error', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

router.post('/:id/like', authMiddleware, async (req, res) => {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
    const { id } = req.params;

    if (typeof id !== 'string') {
        return res.status(400).json({ error: 'Invalid ID' });
    }

    try {
        await addReaction(id, req.user.id);

        // Notify post author
        const post = await getPost(id);
        if (post && post.author_id !== req.user.id) {
            await createNotification(post.author_id, 'like', req.user.id, id);
        }

        res.json({ status: 'liked' });
    } catch (error) {
        console.error('Like error', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

router.delete('/:id/like', authMiddleware, async (req, res) => {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
    const { id } = req.params;

    if (typeof id !== 'string') {
        return res.status(400).json({ error: 'Invalid ID' });
    }

    try {
        await removeReaction(id, req.user.id);
        res.json({ status: 'unliked' });
    } catch (error) {
        console.error('Unlike error', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

export default router;
